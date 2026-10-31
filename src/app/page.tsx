'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TriggerSelection, TriggerType, Playlist, PhysicalSymptomType, DurationType } from '@/types';
import { triggerToEmotion, getTriggerMeta } from '@/lib/trigger';
import RiteHeader from '@/components/RiteHeader';
import ScreenSelection from '@/components/screens/ScreenSelection';
import ScreenAnalysis from '@/components/screens/ScreenAnalysis';
import ScreenDescent from '@/components/screens/ScreenDescent';
import ScreenProvoke from '@/components/screens/ScreenProvoke';
import ScreenVittuilu from '@/components/screens/ScreenVittuilu';
import type { VittuiluAssessment } from '@/lib/validation';
import { SEPPO_STIMULUS, Stimulus, pickStimuli, shouldOfferProvocation } from '@/lib/provocations';
import {
  MAX_STRESS_INTENSITY,
  getActiveStage,
  computeStageAccent,
} from '@/lib/theme';

type ArtistItem = string | { artist?: string; name?: string; link?: string };
type Step = 'selection' | 'analysis' | 'provoke' | 'vittuilu' | 'descent';

// The clinical loading documents are intentional feedback, not a flash of
// chrome. Fast model responses stay visible long enough to complete their
// four-line ritual and briefly settle on the final status; errors still
// surface immediately.
const MIN_LOADING_DURATION_MS = 2200;

function waitForMinimumLoadingDuration(startedAt: number): Promise<void> {
  const remaining = MIN_LOADING_DURATION_MS - (performance.now() - startedAt);
  return remaining > 0 ? new Promise((resolve) => window.setTimeout(resolve, remaining)) : Promise.resolve();
}

// The shape sent to /api/matcher and /api/curator — still keyed on the
// internal EmotionType vocabulary the deterministic genre-mapping engine
// expects. `primary` is derived from the user's trigger pick via
// triggerToEmotion() (lib/trigger.ts), never asked for directly — see that
// file for why this translation layer exists.
// What startAssistant needs to diagnose. Defaults to the intake form's state;
// Seppo's assessment passes its own values because React state set in the
// same tick isn't visible yet.
interface AssistantInput {
  selection: TriggerSelection;
  incidentText: string;
  symptoms: PhysicalSymptomType[];
  duration: DurationType | null;
  provoked: boolean;
  // Seppo's note on the chat, when the intake came from his verdict.
  chatNote?: string;
}

interface Reading {
  analysis: unknown;
  emotionData: EmotionData;
}

interface EmotionData {
  primary: ReturnType<typeof triggerToEmotion>;
  // The user's actual selection, sent alongside its lossy `primary`
  // translation — see lib/trigger.ts for why both are needed.
  trigger: TriggerType;
  stressLevel: number | null;
  event: string | null;
  // Optional, multi-select, additional flavor for the Matcher — see
  // lib/symptoms.ts. Never required, never sent as anything but a plain
  // array (possibly empty).
  symptoms: PhysicalSymptomType[];
  // Optional, single-select, additional flavor for the Matcher (and a small
  // contribution to getActiveStage()'s severity blend) — see lib/duration.ts.
  // null until the user actually picks a tier — same "nothing is dialed in
  // until chosen" contract as stressLevel, never a silent "Fresh" default.
  duration: DurationType | null;
  // True when this intake was pre-filled from a Provoke Me stimulus — the
  // Matcher then treats the vitutus as iatrogenic. See lib/provocations.ts.
  provoked: boolean;
  // Seppo's note on the chat; only the Matcher reads it. See lib/validation.ts.
  chatNote?: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>('selection');

  // Trigger + intensity are a single selection — what kind of frustration it
  // was, and how strongly it's hitting. Emotion never enters the frontend
  // model; it's derived only at the API boundary.
  const [selection, setSelection] = useState<TriggerSelection | null>(null);
  const [incidentText, setIncidentText] = useState<string>('');
  const [symptoms, setSymptoms] = useState<PhysicalSymptomType[]>([]);
  const [duration, setDuration] = useState<DurationType | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [cause, setCause] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [subgenre, setSubgenre] = useState<string | null>(null);

  // Provoke Me: this session's stimuli, and the one the patient said "yes"
  // to (null unless the current intake came from a stimulus).
  const [provokeStimuli, setProvokeStimuli] = useState<Stimulus[]>([]);
  const [provokedBy, setProvokedBy] = useState<Stimulus | null>(null);
  // Where Provoke Me was entered from, so "back" returns there: the Epicrisis
  // after a too-calm reading, or the intake form via the front-page button.
  const [provokeOrigin, setProvokeOrigin] = useState<'selection' | 'analysis'>('analysis');

  // Held between the analysis and descent steps: the curator call needs both,
  // but it only fires once the user chooses to descend, not automatically.
  const [pendingAnalysis, setPendingAnalysis] = useState<unknown>(null);
  const [pendingEmotionData, setPendingEmotionData] = useState<EmotionData | null>(null);

  const triggerLabel = selection ? getTriggerMeta(selection.trigger).label : null;

  // Intensity-driven accent color: the slider's own tier carries the whole
  // signal, independent of which trigger was picked.
  const intensityValue = selection ? selection.intensity : null;
  const combinedIntensity = useMemo(() => {
    return intensityValue !== null ? intensityValue / MAX_STRESS_INTENSITY : 0;
  }, [intensityValue]);

  const stage = useMemo(
    () => getActiveStage(intensityValue, symptoms, duration),
    [intensityValue, symptoms, duration]
  );
  const riteAccent = useMemo(() => computeStageAccent(stage, combinedIntensity), [stage, combinedIntensity]);

  // Page-level "flinch" when the user drags into ELEVEN — a hard shake
  // (no background flash), triggered once per rising edge (not on every
  // pointermove while already past the edge). Toggles a class directly via
  // ref + forced reflow instead of React state, so it never remounts the
  // interactive tree mid-drag (which would kill the slider's active drag).
  const pageRef = useRef<HTMLDivElement>(null);
  const wasAtElevenRef = useRef(false);

  useEffect(() => {
    const atEleven = intensityValue === MAX_STRESS_INTENSITY;
    if (atEleven && !wasAtElevenRef.current && pageRef.current) {
      const el = pageRef.current;
      el.classList.remove('rite-page-flinch');
      void el.offsetWidth; // force reflow so the animation restarts
      el.classList.add('rite-page-flinch');
    }
    wasAtElevenRef.current = atEleven;
  }, [intensityValue]);

  // Screens replace one another in-place rather than through a route change,
  // so the browser otherwise retains the previous screen's scroll position.
  // Reset the document scroll after each screen mounts; assigning both roots
  // also covers mobile Safari's scroll-root behavior.
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [step]);

  // Step 1 of the rite: analyze the input. Stops here and waits for the user
  // to choose to descend — it never advances on its own.
  const startAssistant = async (opts?: { input?: AssistantInput }): Promise<Reading | null> => {
    const input: AssistantInput | null = opts?.input ?? (selection
      ? { selection, incidentText, symptoms, duration, provoked: provokedBy !== null }
      : null);
    if (!input || input.selection.intensity === null) return null;

    const loadingStartedAt = performance.now();
    let completed = false;
    let reading: Reading | null = null;

    setStep('analysis');
    setIsProcessing(true);
    setIsAnalyzing(true);
    setReasoning(null);
    setCause(null);
    setChoice(null);
    setAnalysisError(null);
    setPlaylist(null);
    setSubgenre(null);

    const emotionData: EmotionData = {
      primary: triggerToEmotion(input.selection.trigger),
      trigger: input.selection.trigger,
      stressLevel: input.selection.intensity,
      event: input.incidentText.trim() || null,
      symptoms: input.symptoms,
      duration: input.duration,
      provoked: input.provoked,
      chatNote: input.chatNote,
    };

    try {
      const matcherResponse = await fetch('/api/matcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emotionData }),
      });

      const matcherData = await matcherResponse.json();

      if (matcherData.error) {
        throw new Error(matcherData.error);
      }

      setReasoning(matcherData.reasoning);
      setCause(matcherData.cause || matcherData.reasoning);
      setChoice(matcherData.choice || '');
      setSubgenre(matcherData.subgenre || null);
      setPendingAnalysis(matcherData.analysis);
      setPendingEmotionData(emotionData);
      reading = { analysis: matcherData.analysis, emotionData };
      completed = true;
    } catch (error) {
      console.error('Error processing incident analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze incident. Please try again.';
      setAnalysisError(errorMessage);
    } finally {
      if (completed) await waitForMinimumLoadingDuration(loadingStartedAt);
      setIsAnalyzing(false);
      setIsProcessing(false);
    }
    return reading;
  };

  // Seppo's remarks arrive after the list is already on screen: they are
  // decoration, so a failure leaves the prescription untouched. The playlist
  // id guards against the patient having reset or re-run in the meantime.
  const attachSeppoNotes = async (curated: Playlist, incident: string | null) => {
    try {
      const res = await fetch('/api/seppo-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artists: curated.tracks.map((t) => t.artist),
          subgenre,
          ...(incident ? { incident } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !Array.isArray(data.notes)) throw new Error(data.error || 'Seppo is unavailable');
      const byArtist = new Map<string, string>(
        data.notes.map((n: { artist: string; note: string }) => [n.artist.toLowerCase(), n.note])
      );
      setPlaylist((current) =>
        current && current.id === curated.id
          ? { ...current, tracks: current.tracks.map((t) => ({ ...t, seppoNote: byArtist.get(t.artist.toLowerCase()) })) }
          : current
      );
    } catch (error) {
      console.error('Error fetching Seppo notes:', error);
    }
  };

  // Step 2: only fires when the user explicitly chooses to descend.
  const beginDescent = async (reading?: Reading) => {
    const emotionData = reading?.emotionData ?? pendingEmotionData;
    const analysis = reading ? reading.analysis : pendingAnalysis;
    if (!emotionData) return;

    // Already curated this reading (e.g. the user stepped back to analysis
    // and is descending again) — just show it, don't re-fetch.
    if (playlist) {
      setStep('descent');
      return;
    }

    setStep('descent');
    setIsProcessing(true);
    const loadingStartedAt = performance.now();
    let completed = false;

    try {
      const curatorResponse = await fetch('/api/curator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, emotionData }),
      });

      const curatorData = await curatorResponse.json();

      if (curatorData.error) {
        throw new Error(curatorData.error);
      }

      if (curatorData.artists && curatorData.artists.length > 0) {
        const tracks = curatorData.artists.map((artistItem: ArtistItem, index: number) => {
          const displayName = typeof artistItem === 'string' ? artistItem : artistItem.artist || artistItem.name || '';
          return {
            id: `artist-${index}`,
            name: displayName,
            artist: displayName,
            album: 'Artist Collection',
            genre: 'metal',
            // A name-prefilled search is more reliable than a model-supplied
            // direct URL and lets the listener choose the right artist page,
            // release, or label listing on Bandcamp.
            bandcampUrl: `https://bandcamp.com/search?q=${encodeURIComponent(displayName)}`,
          };
        });

        const curated: Playlist = {
          id: `ai-generated-${Date.now()}`,
          name: 'Curated Artists',
          description: `10 curated artists for ${getTriggerMeta(emotionData.trigger).label}`,
          tracks,
        };
        setPlaylist(curated);
        // Seppo annotates the list only when he is the one who diagnosed.
        if (provokedBy === SEPPO_STIMULUS && subgenre) void attachSeppoNotes(curated, emotionData.event);
      }
      completed = true;
    } catch (error) {
      console.error('Error curating descent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to curate artists. Please try again.';
      setReasoning(`Error: ${errorMessage}`);
    } finally {
      if (completed) await waitForMinimumLoadingDuration(loadingStartedAt);
      setIsProcessing(false);
    }
  };

  const resetSelections = () => {
    setStep('selection');
    setSelection(null);
    setIncidentText('');
    setSymptoms([]);
    setDuration(null);
    setPlaylist(null);
    setReasoning(null);
    setCause(null);
    setChoice(null);
    setAnalysisError(null);
    setPendingAnalysis(null);
    setPendingEmotionData(null);
    setSubgenre(null);
    setProvokedBy(null);
  };

  const clearInputs = () => {
    setSelection(null);
    setIncidentText('');
    setSymptoms([]);
    setDuration(null);
    setProvokedBy(null);
  };

  // Provoke Me — a fresh draw each time the referral is accepted.
  const startProvocation = (origin: 'selection' | 'analysis') => {
    setProvokeOrigin(origin);
    setProvokeStimuli(pickStimuli());
    setStep('provoke');
  };

  // "Joko vituttaa?" → yes: a fresh intake pre-filled from the stimulus. The
  // patient still dials in intensity and duration themselves — the clinic
  // provides the grievance, not the reading. Symptoms are cleared so the
  // previous (possibly pseudo-vitutus) profile doesn't pin the new reading.
  const prefillFromStimulus = (stimulus: Stimulus) => {
    goBackToSelection();
    setSelection({ trigger: stimulus.trigger, intensity: null });
    setIncidentText(stimulus.incident);
    setSymptoms([]);
    setDuration(null);
    setSubgenre(null);
    setProvokedBy(stimulus);
  };

  // Seppo's verdict replaces the intake form: his values become the
  // selection and the Matcher runs, then the patient lands on the diagnosis
  // (Observation / Treatment) like every other reading and presses Get
  // Prescription themselves. The Matcher is flagged iatrogenic, as for every
  // other Seppo/Provoke Me reading, and gets Seppo's note on the chat. If the
  // Matcher fails, the analysis screen's retry takes over.
  const prescribeFromSeppo = async (assessment: VittuiluAssessment) => {
    const sel: TriggerSelection = { trigger: assessment.trigger, intensity: assessment.intensity };
    goBackToSelection();
    setSelection(sel);
    setIncidentText(assessment.incident);
    setSymptoms(assessment.symptoms);
    setDuration(assessment.duration);
    setSubgenre(null);
    setProvokedBy(SEPPO_STIMULUS);

    await startAssistant({
      input: { selection: sel, incidentText: assessment.incident, symptoms: assessment.symptoms, duration: assessment.duration, provoked: true, chatNote: assessment.observation_note },
    });
  };

  // "Joko vituttaa?" → yes. The stimulus gives trigger + incident; the
  // assessor model reads off the intensity, duration is "just now" and there
  // are no symptoms, and the intake is submitted straight to the analysis, so
  // the patient lands on the diagnosis instead of a pre-filled form. If the
  // assessor is unavailable, fall back to the pre-filled form.
  const acceptStimulus = async (stimulus: Stimulus, chatNote?: string) => {
    goBackToSelection();
    setStep('analysis');
    setIsAnalyzing(true);
    setIsProcessing(true);
    setSubgenre(null);
    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: stimulus.trigger, incident: stimulus.incident }),
      });
      const data = await res.json();
      if (!res.ok || data.error || typeof data.intensity !== 'number') throw new Error(data.error || 'Assessment unavailable');

      const sel: TriggerSelection = { trigger: stimulus.trigger, intensity: data.intensity };
      setSelection(sel);
      setIncidentText(stimulus.incident);
      setSymptoms([]);
      setDuration('just_now');
      setProvokedBy(stimulus);
      await startAssistant({
        input: { selection: sel, incidentText: stimulus.incident, symptoms: [], duration: 'just_now', provoked: true, chatNote },
      });
    } catch (error) {
      console.error('Error assessing stimulus:', error);
      setIsAnalyzing(false);
      setIsProcessing(false);
      prefillFromStimulus(stimulus);
    }
  };

  // Back from the analysis screen: return to selection but keep the
  // existing trigger/intensity picks so the user can just adjust and
  // resubmit, rather than a full reset. Clears the analysis result state so
  // `canSubmit` re-enables (it's gated on `!reasoning`).
  const goBackToSelection = () => {
    setStep('selection');
    setPlaylist(null);
    setReasoning(null);
    setCause(null);
    setChoice(null);
    setAnalysisError(null);
    setPendingAnalysis(null);
    setPendingEmotionData(null);
  };

  const canSubmit = Boolean(selection) && selection?.intensity !== null && duration !== null && !isProcessing && !reasoning;

  return (
    <div
      ref={pageRef}
      className="min-h-dvh relative"
      style={
        {
          background: '#f7f5f0',
          color: '#2f2e2b',
          '--rite-accent': riteAccent.accent,
          '--rite-border': riteAccent.border,
          '--rite-glow': riteAccent.glow,
        } as React.CSSProperties
      }
    >
      {/* Subtle grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          backgroundSize: '200px 200px',
        }}
      />

      <div className={`container mx-auto px-6 max-[480px]:px-4 pt-8 pb-4 max-w-7xl relative ${step === 'analysis' ? 'max-[640px]:pt-4' : ''}`}>
        <RiteHeader onGoHome={resetSelections} showHeadline={step === 'selection'} />

        {step === 'selection' && (
          <ScreenSelection
            selection={selection}
            onSelectionChange={setSelection}
            incidentText={incidentText}
            onIncidentTextChange={setIncidentText}
            symptoms={symptoms}
            onSymptomsChange={setSymptoms}
            duration={duration}
            onDurationChange={setDuration}
            isProcessing={isProcessing}
            canSubmit={canSubmit}
            onSubmit={() => void startAssistant()}
            onReset={clearInputs}
            onProvoke={() => startProvocation('selection')}
          />
        )}

        {step === 'analysis' && (
          <ScreenAnalysis
            stage={stage}
            cause={cause}
            choice={choice}
            subgenre={subgenre}
            isAnalyzing={isAnalyzing}
            error={analysisError}
            onContinue={() => void beginDescent()}
            onRetry={() => void startAssistant()}
            onBack={goBackToSelection}
            offerProvocation={shouldOfferProvocation(stage)}
            onProvoke={() => startProvocation('analysis')}
            provokedBy={provokedBy}
          />
        )}

        {step === 'provoke' && (
          <ScreenProvoke
            stimuli={provokeStimuli}
            onConfirm={(s) => void acceptStimulus(s)}
            onEscalate={() => setStep('vittuilu')}
            onBack={() => setStep(provokeOrigin)}
            backLabel={provokeOrigin === 'selection' ? 'Back to intake' : 'Back to Epicrisis'}
          />
        )}

        {step === 'vittuilu' && (
          <ScreenVittuilu
            intake={{
              event: incidentText.trim() || null,
              trigger: selection?.trigger ?? null,
              intensity: selection?.intensity ?? null,
              symptoms,
              duration,
            }}
            onConfirm={(note) => void acceptStimulus(SEPPO_STIMULUS, note)}
            onAssessed={(a) => void prescribeFromSeppo(a)}
            onBack={() => setStep(provokeOrigin)}
            onReset={resetSelections}
          />
        )}

        {step === 'descent' && (
          <ScreenDescent
            stage={stage}
            selection={selection}
            triggerLabel={triggerLabel}
            playlist={playlist}
            isProcessing={isProcessing}
            isAnalyzing={isAnalyzing}
            reasoning={reasoning}
            subgenre={subgenre}
            onReset={resetSelections}
            onBack={() => setStep('analysis')}
          />
        )}
      </div>
    </div>
  );
}
