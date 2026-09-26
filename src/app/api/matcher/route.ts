import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AnalysisSchema, MatcherRequestSchema, validateRequest } from '@/lib/validation';
import { getDeterministicGenre } from '@/lib/genre-mapping';
import { STRESS_VALUE_TO_LABEL, getActiveStage, STAGES } from '@/lib/theme';
import { MATCHER_INSTRUCTIONS } from '@/lib/prompts';
import { getSymptomMeta, isPseudoVitutusProfile } from '@/lib/symptoms';
import { getDurationMeta } from '@/lib/duration';

const MATCHER_MODEL = 'gpt-4.1';

// The Epicrisis header is the single source of the diagnosis label. The
// model receives it as severity context, but prose must not restate it.
const STAGE_NAMES_PATTERN = STAGES.map((stage) => stage.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const STAGE_REFERENCE_PATTERN = new RegExp(
  `\\bStage\\s+(?:I|II|III|IV|V|VI|VII|VIII|IX)\\b(?:\\s*[—-]\\s*(?:${STAGE_NAMES_PATTERN}))?`,
  'gi'
);
const STAGE_NAME_PATTERN = new RegExp(`\\b(?:${STAGE_NAMES_PATTERN})\\b`, 'gi');

function removeDisplayedCondition(text: string): string {
  if (!text) return text;
  return text
    .replace(STAGE_REFERENCE_PATTERN, '')
    .replace(STAGE_NAME_PATTERN, '')
    .replace(/\b(?:classic|textbook)\s*[:—-]\s*/gi, '')
    .replace(/\b(?:for|with|of)\s*:\s*/gi, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // Constructed inside the handler, not at module scope — module scope
    // runs during Next.js's build-time "Collecting page data" step, before
    // OPENAI_API_KEY is necessarily available, and the SDK throws
    // immediately on a missing key, failing the build itself.
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await request.json();

    // Validate request data
    const validation = validateRequest(MatcherRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { emotionData } = validation.data!;

    if (!emotionData) {
      return NextResponse.json(
        { error: 'Emotion data is required' },
        { status: 400 }
      );
    }

    // The prompt expects a stress *description* ("Overload", "Moderate", ...)
    // that it maps to a number internally per its own persona — not our raw
    // numeric intensity. Also: use a null check, not `||`, since a valid
    // stress value of 0 ("Intolerable lightness") is falsy and would
    // otherwise be silently treated as "no stress level selected".
    const stressLabel = emotionData.stressLevel != null ? STRESS_VALUE_TO_LABEL[emotionData.stressLevel] ?? 'none' : 'none';

    // The same deterministic (intensity, symptoms, duration) -> Stage
    // lookup the analysis screen already uses for its prominent diagnosis
    // display — computed again so the model has severity context without
    // needing to repeat that label in prose. Trigger/emotion is deliberately NOT an input to
    // this — see the comment above getActiveStage() in lib/theme.ts.
    const stage = getActiveStage(emotionData.stressLevel ?? null, emotionData.symptoms ?? [], emotionData.duration ?? null);
    const condition = `Stage ${stage.roman} — ${stage.name}`;

    // A stabilizing prior, not a forced answer: the same deterministic
    // (emotion, stress) lookup as before, but now handed to the model as
    // anchor_subgenre — a strong default it should stay close to unless the
    // incident text gives it a specific reason to deviate. This keeps most
    // readings clustered the way they were under the old fully-deterministic
    // scheme (and preserves its invented-microgenre flavor text at high
    // intensity), while letting incident content actually influence genre
    // selection, which the old forced-override version never allowed.
    const anchorGenre = getDeterministicGenre(emotionData.primary, emotionData.stressLevel ?? null);

    // "The gap" — when a near-nonexistent event description still lands the
    // most severe stage, the funniest cause isn't inventing drama for a
    // trivial input, it's the app noticing its own disproportionate
    // reaction. Trivial = under 15 chars (covers "cold coffee" and leaving
    // the field empty alike).
    const trimmedEvent = (emotionData.event || '').trim();
    const isGapMoment = trimmedEvent.length < 15 && stage.index === 9;
    const gapDirective = isGapMoment
      ? `\n\nSPECIAL CASE: The event description is trivial ("${trimmedEvent || 'nothing typed at all'}") yet the header shows the most severe diagnosis. For "cause" ONLY, do not invent drama about the event — instead call out this exact mismatch directly, in the same dark comic voice: how little was given versus how much the app is dramatizing it. Keep "choice" normal.`
      : '';

    // "Pseudo-vitutus" — the real Vitutusviisari study found severe vitutus
    // is characterized by sympathetic-activation symptoms (head exploding,
    // muscle tension, heart pounding, accelerated breathing); weakness and
    // legs going limp are parasympathetic markers the study found rare even
    // during severe episodes. Reporting ONLY those two, with none of the
    // sympathetic four, while claiming high intensity is the exact inverse
    // of what real severe vitutus looks like — a legitimate "this isn't
    // textbook" bit, not a manufactured one. Exact-set match via the same
    // isPseudoVitutusProfile() that also drives getActiveStage()'s Stage
    // cap (lib/theme.ts) — one predicate, so the two can never drift apart.
    //
    // Gated on the RAW stressLevel (>= 7 of 10), not `stage.index` — the
    // latter is now itself capped low by getActiveStage() whenever this
    // exact profile matches, so gating on it here would almost never see a
    // "severe" reading again and silently disable this directive. Gating on
    // what the person actually claimed on the slider is also more correct:
    // the joke is about the claim not matching the profile, independent of
    // whatever Stage number falls out afterward. >= 7 is the approximate
    // pre-cap equivalent of the old stage.index >= 6 threshold.
    const isPseudoVitutusMoment =
      isPseudoVitutusProfile(emotionData.symptoms ?? []) &&
      (emotionData.stressLevel ?? 0) >= 7;
    const pseudoVitutusDirective = isPseudoVitutusMoment
      ? `\n\nSPECIAL CASE: The only physical symptoms reported are weakness and legs going limp — real, but the two the app's own cited research found are rare even during severe episodes (which are typically dominated by head-exploding/muscle-tension/heart-pounding/accelerated-breathing instead). The displayed condition already reflects this — the diagnosis itself has been capped low, refusing to certify high severity for this profile. For "cause" ONLY, the persona may gently call out this presentation as suspiciously atypical — arguably "pseudo-vitutus," not the textbook thing — before proceeding completely normally. Subgenre, sonic profile, and prescription are all unaffected: the treatment is delivered in full regardless. Keep "choice" normal.`
      : '';

    // Optional, self-reported, multi-select — real items from the same
    // study the app cites elsewhere (see lib/symptoms.ts), never required.
    const symptomsList = (emotionData.symptoms ?? []).map((s) => getSymptomMeta(s).label);
    const symptomsLine = symptomsList.length > 0 ? symptomsList.join(', ') : 'none reported';

    // Optional, self-reported, single-select — see lib/duration.ts. No
    // default: an untouched control is "not reported", same convention as
    // symptomsLine above, never silently stood in for by "Fresh".
    const durationLine = emotionData.duration ? getDurationMeta(emotionData.duration).label : 'not reported';

    // Use OpenAI Responses API with in-repo instructions (no hosted Prompt
    // Object) — variables are embedded directly in the input text instead.
    const response = await openai.responses.create({
      model: MATCHER_MODEL,
      instructions: MATCHER_INSTRUCTIONS,
      input: `trigger: ${emotionData.trigger}\nstress_level: ${stressLabel}\ncondition: ${condition}\nevent: ${emotionData.event || 'none'}\nanchor_subgenre: ${anchorGenre.genre}\nphysical_symptoms: ${symptomsLine}\nduration_persistence: ${durationLine}\n\nKeep "cause" and especially "choice" SHORT and punchy: 2-3 sentences max, no purple prose, no run-on sentences. The condition is already displayed prominently in the Epicrisis header: do not name, paraphrase, or repeat it in either prose field.${gapDirective}${pseudoVitutusDirective}`,
    });

    // Handle different response formats
    let responseText = response.output_text;
    // Response processing completed

    // If output_text is undefined, try to get text from output array
    if (!responseText && response.output && Array.isArray(response.output)) {
      const messageOutput = response.output.find(item => item.type === 'message');
      if (messageOutput && messageOutput.content && messageOutput.content[0]) {
        const firstContent = messageOutput.content[0];
        if ('text' in firstContent) {
          responseText = firstContent.text;
        }
      }
    }

    // Additional fallback: sometimes the response comes back as an array directly
    if (!responseText && Array.isArray(response.output)) {
      // Try to find a text response in the array
      for (const item of response.output) {
        if (item.type === 'message' && Array.isArray(item.content)) {
          const textContent = item.content.find(c => c.type === 'output_text');
          if (textContent && textContent.type === 'output_text' && textContent.text) {
            responseText = textContent.text;
            break;
          }
        }
      }
    }

    if (!responseText) {
      // No response text found in expected format
      return NextResponse.json(
        { error: 'No response received from AI' },
        { status: 500 }
      );
    }

    // Parse structured JSON response
    let analysisResult = null;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try to extract key information from text. The subgenre
        // falls back to the anchor here — the fallback only needs to
        // salvage the cause/choice prose. sonic_profile has no incident-
        // specific signal to recover from free text, so it gets a neutral
        // default; AnalysisSchema requires the field to be present.
        const detectedSubgenre = anchorGenre.genre;
        const fallbackSonicProfile = {
          activation: 'driving' as const,
          agency: 'assertion' as const,
          friction: 'abrasive' as const,
          cognitive_density: 'direct' as const,
          weight: 'heavy' as const,
        };

        // Try to extract cause and choice from existing text response
        const paragraphs = responseText.split('\n\n').filter(p => p.trim());
        let cause = '';
        let choice = '';

        // Try to find patterns for cause and choice in the text
        for (const paragraph of paragraphs) {
          if (paragraph.toLowerCase().includes('cause') ||
              paragraph.toLowerCase().includes('stress') ||
              paragraph.toLowerCase().includes('corporate') ||
              paragraph.toLowerCase().includes('transformation') ||
              paragraph.includes('IT')) {
            cause = paragraph.trim();
          } else if (paragraph.toLowerCase().includes('metal') ||
                    paragraph.toLowerCase().includes('catharsis') ||
                    paragraph.toLowerCase().includes('relief') ||
                    paragraph.toLowerCase().includes('chosen')) {
            choice = paragraph.trim();
          }
        }

        // Fallback to splitting the text roughly in half
        if (!cause && !choice && paragraphs.length >= 2) {
          const midpoint = Math.floor(paragraphs.length / 2);
          cause = paragraphs.slice(0, midpoint).join(' ').trim();
          choice = paragraphs.slice(midpoint).join(' ').trim();
        } else if (!cause && !choice && responseText.length > 200) {
          // Split long single paragraph
          const sentences = responseText.split(/[.!?]+/).filter(s => s.trim());
          const midpoint = Math.floor(sentences.length / 2);
          cause = sentences.slice(0, midpoint).join('. ').trim() + '.';
          choice = sentences.slice(midpoint).join('. ').trim() + '.';
        }

        // Create fallback result with extracted cause and choice
        analysisResult = {
          subgenre: detectedSubgenre,
          sonic_profile: fallbackSonicProfile,
          cause: cause || 'Professional burnout and organizational stress',
          choice: choice || `${detectedSubgenre} provides cathartic relief for the current emotional state`
        };
      }
    } catch {
      // Failed to parse matcher response
      return NextResponse.json(
        { error: 'Failed to parse analysis response' },
        { status: 500 }
      );
    }

    if (!analysisResult) {
      return NextResponse.json(
        { error: 'No structured analysis received' },
        { status: 500 }
      );
    }

    // Safety net only — fills in the anchor if the model's response is
    // missing/empty, never overrides a subgenre it actually chose. The old
    // version forced this every time; that's exactly the "never left to the
    // AI's judgment" behavior this change intentionally moves away from.
    analysisResult.subgenre = analysisResult.subgenre || anchorGenre.genre;

    // The stage is already rendered as the Epicrisis diagnosis. This guards
    // the visual hierarchy against a model that nevertheless echoes it.
    analysisResult.cause = removeDisplayedCondition(analysisResult.cause);
    analysisResult.choice = removeDisplayedCondition(analysisResult.choice);

    // Validate the shape before it can reach the Curator — a malformed
    // sonic_profile (wrong enum token, missing key) is far easier to
    // diagnose and recover from here than after it's already failed
    // CuratorRequestSchema validation downstream.
    const parsedAnalysis = AnalysisSchema.safeParse(analysisResult);
    if (!parsedAnalysis.success) {
      analysisResult.sonic_profile = {
        activation: 'driving',
        agency: 'assertion',
        friction: 'abrasive',
        cognitive_density: 'direct',
        weight: 'heavy',
      };
      const retryParsed = AnalysisSchema.safeParse(analysisResult);
      if (!retryParsed.success) {
        return NextResponse.json(
          { error: 'Received a malformed analysis response' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      analysis: analysisResult,
      reasoning: responseText, // Include full response text for backward compatibility
      cause: analysisResult.cause || responseText, // Separate cause field
      choice: analysisResult.choice || '', // Separate choice field
      subgenre: analysisResult.subgenre || 'metal' // Separate subgenre field
    });

  } catch (error) {
    console.error('Matcher API error:', error);
    return NextResponse.json(
      { error: 'Failed to process emotional analysis' },
      { status: 500 }
    );
  }
}
