'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { EmotionWheelSelection, Playlist } from '@/types';
import RiteHeader from '@/components/RiteHeader';
import ScreenSelection from '@/components/screens/ScreenSelection';
import ScreenAnalysis from '@/components/screens/ScreenAnalysis';
import ScreenDescent from '@/components/screens/ScreenDescent';
import {
  MAX_STRESS_INTENSITY,
  LOADING_MESSAGES,
  pickRandom,
  getActiveCircle,
  computeCircleAccent,
} from '@/lib/theme';

type ArtistItem = string | { artist?: string; name?: string; link?: string };
type Step = 'selection' | 'analysis' | 'descent';

interface EmotionData {
  primary: EmotionWheelSelection['emotion'];
  stressLevel: number | null;
  event: string | null;
}

export default function Home() {
  const [step, setStep] = useState<Step>('selection');

  // Emotion + intensity are a single selection now — the wheel's radial
  // drag distance snaps to the stress tier, replacing the old separate
  // stress vial entirely.
  const [primarySelection, setPrimarySelection] = useState<EmotionWheelSelection | null>(null);
  const [eventDescription, setEventDescription] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [cause, setCause] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [subgenre, setSubgenre] = useState<string | null>(null);

  // Held between the analysis and descent steps: the curator call needs both,
  // but it only fires once the user chooses to descend, not automatically.
  const [pendingAnalysis, setPendingAnalysis] = useState<unknown>(null);
  const [pendingEmotionData, setPendingEmotionData] = useState<EmotionData | null>(null);

  // Intensity-driven accent color: the wheel's own stress tier now carries
  // the whole signal, no separate emotion-intensity axis to blend in.
  const stressValue = primarySelection ? primarySelection.stressLevel : null;
  const combinedIntensity = useMemo(() => {
    return stressValue !== null ? stressValue / MAX_STRESS_INTENSITY : 0;
  }, [stressValue]);

  const circle = useMemo(
    () => getActiveCircle(primarySelection?.emotion ?? null, stressValue),
    [primarySelection?.emotion, stressValue]
  );
  const riteAccent = useMemo(() => computeCircleAccent(circle, combinedIntensity), [circle, combinedIntensity]);

  // Page-level "flinch" when the user drags into ELEVEN — a hard shake +
  // one-frame red flash, triggered once per rising edge (not on every
  // pointermove while already past the edge). Toggles a class directly via
  // ref + forced reflow instead of React state, so it never remounts the
  // interactive tree mid-drag (which would kill the wheel's active drag).
  const pageRef = useRef<HTMLDivElement>(null);
  const wasAtElevenRef = useRef(false);

  useEffect(() => {
    const atEleven = stressValue === MAX_STRESS_INTENSITY;
    if (atEleven && !wasAtElevenRef.current && pageRef.current) {
      const el = pageRef.current;
      el.classList.remove('rite-page-flinch');
      void el.offsetWidth; // force reflow so the animation restarts
      el.classList.add('rite-page-flinch');
    }
    wasAtElevenRef.current = atEleven;
  }, [stressValue]);

  // Step 1 of the rite: analyze the input. Stops here and waits for the user
  // to choose to descend — it never advances on its own.
  const startAssistantWithWheelData = async () => {
    if (!primarySelection) return;

    setStep('analysis');
    setIsProcessing(true);
    setIsAnalyzing(true);
    setReasoning(null);
    setCause(null);
    setChoice(null);
    setAnalysisError(null);
    setPlaylist(null);
    setSubgenre(null);
    setLoadingMessage(pickRandom(LOADING_MESSAGES.analyzing));

    const emotionData: EmotionData = {
      primary: primarySelection.emotion,
      stressLevel: primarySelection.stressLevel,
      event: eventDescription.trim() || null,
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
    } catch (error) {
      console.error('Error processing emotion analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze emotional state. Please try again.';
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setIsProcessing(false);
    }
  };

  // Step 2: only fires when the user explicitly chooses to descend.
  const beginDescent = async () => {
    if (!pendingEmotionData) return;

    // Already curated this reading (e.g. the user stepped back to analysis
    // and is descending again) — just show it, don't re-fetch.
    if (playlist) {
      setStep('descent');
      return;
    }

    setStep('descent');
    setIsProcessing(true);
    setLoadingMessage(pickRandom(LOADING_MESSAGES.curating));

    try {
      const curatorResponse = await fetch('/api/curator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: pendingAnalysis, emotionData: pendingEmotionData }),
      });

      const curatorData = await curatorResponse.json();

      if (curatorData.error) {
        if (curatorData.debug) {
          console.error('Curator Debug Info:', curatorData.debug);
        }
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
            bandcampUrl: (typeof artistItem !== 'string' && artistItem.link) || `https://bandcamp.com/search?q=${encodeURIComponent(displayName)}`,
          };
        });

        setPlaylist({
          id: `ai-generated-${Date.now()}`,
          name: 'Curated Artists',
          description: `10 curated artists for ${pendingEmotionData.primary} mood`,
          tracks,
        });
      }
    } catch (error) {
      console.error('Error curating descent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to curate artists. Please try again.';
      setReasoning(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSelections = () => {
    setStep('selection');
    setPrimarySelection(null);
    setEventDescription('');
    setPlaylist(null);
    setReasoning(null);
    setCause(null);
    setChoice(null);
    setAnalysisError(null);
    setPendingAnalysis(null);
    setPendingEmotionData(null);
    setSubgenre(null);
  };

  const clearInputs = () => {
    setPrimarySelection(null);
    setEventDescription('');
  };

  // Back from the analysis screen: return to selection but keep the
  // existing emotion/stress picks so the user can just adjust and resubmit,
  // rather than a full reset. Clears the analysis result state so `canSubmit`
  // re-enables (it's gated on `!reasoning`).
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

  const canSubmit = Boolean(primarySelection) && !isProcessing && !reasoning;

  return (
    <div
      ref={pageRef}
      className="min-h-screen text-white relative bg-black"
      style={
        {
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

      <div className="container mx-auto px-6 pt-8 pb-4 max-w-7xl relative">
        <RiteHeader onGoHome={resetSelections} />

        {step === 'selection' && (
          <ScreenSelection
            primarySelection={primarySelection}
            onPrimarySelectionChange={setPrimarySelection}
            eventDescription={eventDescription}
            onEventDescriptionChange={setEventDescription}
            isProcessing={isProcessing}
            canSubmit={canSubmit}
            onSubmit={startAssistantWithWheelData}
            onReset={clearInputs}
          />
        )}

        {step === 'analysis' && (
          <ScreenAnalysis
            circle={circle}
            primarySelection={primarySelection}
            cause={cause}
            choice={choice}
            isAnalyzing={isAnalyzing}
            loadingMessage={loadingMessage}
            error={analysisError}
            onContinue={beginDescent}
            onRetry={startAssistantWithWheelData}
            onBack={goBackToSelection}
          />
        )}

        {step === 'descent' && (
          <ScreenDescent
            circle={circle}
            primarySelection={primarySelection}
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
