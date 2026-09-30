import { NextRequest, NextResponse } from 'next/server';
import { AnalysisSchema, MatcherRequestSchema, SubgenreSchema, validateRequest } from '@/lib/validation';
import { getDeterministicGenre } from '@/lib/genre-mapping';
import { STRESS_VALUE_TO_LABEL, getActiveStage } from '@/lib/theme';
import { removeDisplayedCondition } from '@/lib/condition-text';
import { MATCHER_INSTRUCTIONS } from '@/lib/prompts';
import { getSymptomMeta, isPseudoVitutusProfile } from '@/lib/symptoms';
import { getDurationMeta } from '@/lib/duration';
import { createWithRetry } from '@/lib/openai-response';
import { getOpenAI } from '@/lib/openai-client';
import type { TriggerType } from '@/types';

const MATCHER_MODEL = 'gpt-4.1';

// The "treatment" for Level 0: Pseudo-vitutus (see isPseudoVitutusMoment
// below) — metal has not been medically indicated for this presentation,
// so the prescribed genre downgrades entirely out of metal. A small
// formulary rather than one fixed fallback, so the joke doesn't go stale
// on repeat; each entry is a real, well-known non-metal genre direction,
// picked for comedic fit with that trigger.
const PSEUDO_VITUTUS_GENRE: Record<TriggerType, string> = {
  injustice: 'smooth jazz', // your grievance has been noted and gently ignored
  failure: 'singer-songwriter', // sit with your feelings, alone, with a guitar
  conflict: 'indie pop', // breezy, doesn't even acknowledge the fight happened
  helplessness: 'trip-hop', // low-energy, horizontal, nothing to be done
  overload: 'adult contemporary', // you don't need adrenaline, you need a nap
  exhaustion: 'adult contemporary',
  uncertainty: 'trip-hop',
  absurdity: 'smooth jazz',
};

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    // Validate request data
    const validation = validateRequest(MatcherRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { emotionData } = validation.data!;

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
    // sympathetic four, is the exact inverse of what real severe vitutus
    // looks like — a legitimate "this isn't textbook" bit, not a
    // manufactured one. Exact-set match via the same isPseudoVitutusProfile()
    // that also drives getActiveStage()'s dedicated "Level 0" Stage
    // (lib/theme.ts) — one predicate, so the two can never drift apart.
    //
    // Unconditional on intensity, matching the Stage itself: getActiveStage()
    // now returns PSEUDO_VITUTUS_STAGE for this exact profile at ANY
    // intensity (not just high), so the directive fires the same way — a
    // header that says "Level 0: Pseudo-vitutus" while the cause text
    // treated it like a real Stage IX meltdown would read as a bug, not a
    // joke.
    //
    // The prescription itself downgrades too now (previously it stayed a
    // real metal genre regardless) — see PSEUDO_VITUTUS_GENRE above. The
    // Curator (src/lib/prompts.ts, CURATOR_INSTRUCTIONS) has a matching
    // exception clause letting it curate real artists in that non-metal
    // genre instead of forcing a metal pick.
    const isPseudoVitutusMoment = isPseudoVitutusProfile(emotionData.symptoms ?? []);
    const pseudoVitutusDirective = isPseudoVitutusMoment
      ? `\n\nSPECIAL CASE: The only physical symptoms reported are weakness and legs going limp — real, but the two the app's own cited research found are rare even during severe episodes (which are typically dominated by head-exploding/muscle-tension/heart-pounding/accelerated-breathing instead). The displayed condition already reflects this — the diagnosis is "Level 0: Pseudo-vitutus," a dedicated tier below the real I-IX scale, refusing to certify this as real vitutus at all. For "cause" ONLY, the persona may gently call out this presentation as suspiciously atypical — arguably "pseudo-vitutus," not the textbook thing. Metal has not been medically indicated for this presentation: ignore anchor_subgenre entirely and set "subgenre" to exactly "${PSEUDO_VITUTUS_GENRE[emotionData.trigger]}" (a real, well-known direction in that genre — not metal, not metal-adjacent). Still fill all five sonic_profile fields with your best plausible tokens (the schema requires them; they aren't load-bearing here). Write "choice" in the same deadpan-clinical voice, but borrowing pharma-commercial register (in the spirit of "ask your consultant if doing absolutely nothing is right for you") to explain why a declined diagnosis gets a real-but-anticlimactic prescription instead of metal — do NOT invoke the arousal-matching/Sharman & Dingle mechanism here, it's specific to extreme music and doesn't apply.`
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
    // One retry if the reply isn't a JSON object; see lib/openai-response.ts.
    const analysisResult = await createWithRetry(
      () => getOpenAI().responses.create({
        model: MATCHER_MODEL,
        instructions: MATCHER_INSTRUCTIONS,
        input: `trigger: ${emotionData.trigger}\nstress_level: ${stressLabel}\ncondition: ${condition}\nevent: ${emotionData.event || 'none'}\nanchor_subgenre: ${anchorGenre.genre}\nphysical_symptoms: ${symptomsLine}\nduration_persistence: ${durationLine}\n\nKeep "cause" and especially "choice" SHORT and punchy: 2-3 sentences max, no purple prose, no run-on sentences. The condition is already displayed prominently in the Epicrisis header: do not name, paraphrase, or repeat it in either prose field.${gapDirective}${pseudoVitutusDirective}`,
      }),
      (json) => json
    );

    if (!analysisResult) {
      console.error('Matcher: no JSON object in model response after retry');
      return NextResponse.json(
        { error: 'Failed to parse analysis response' },
        { status: 500 }
      );
    }

    // Safety net only — fills in the anchor if the model's subgenre is
    // missing, empty, or fails SubgenreSchema (too long / odd characters),
    // never overrides a valid subgenre it actually chose. The old version
    // forced this every time; that's exactly the "never left to the AI's
    // judgment" behavior this change intentionally moves away from.
    if (!SubgenreSchema.safeParse(analysisResult.subgenre).success) {
      analysisResult.subgenre = anchorGenre.genre;
    }

    // The stage is already rendered as the Epicrisis diagnosis. This guards
    // the visual hierarchy against a model that nevertheless echoes it.
    for (const key of ['cause', 'choice'] as const) {
      const text = analysisResult[key];
      analysisResult[key] = typeof text === 'string' ? removeDisplayedCondition(text) : undefined;
    }

    // Validate the shape before it can reach the Curator — a malformed
    // sonic_profile (wrong enum token, missing key) is far easier to
    // diagnose and recover from here than after it's already failed
    // CuratorRequestSchema validation downstream.
    let parsedAnalysis = AnalysisSchema.safeParse(analysisResult);
    if (!parsedAnalysis.success) {
      analysisResult.sonic_profile = {
        activation: 'driving',
        agency: 'assertion',
        friction: 'abrasive',
        cognitive_density: 'direct',
        weight: 'heavy',
      };
      parsedAnalysis = AnalysisSchema.safeParse(analysisResult);
      if (!parsedAnalysis.success) {
        return NextResponse.json(
          { error: 'Received a malformed analysis response' },
          { status: 500 }
        );
      }
    }

    // Only schema-validated fields leave the server — anything extra the
    // model invented is stripped by the parse.
    const analysis = parsedAnalysis.data;

    // `reasoning` is kept for response-shape compatibility — the client
    // only uses it as a non-empty "analysis exists" flag (page.tsx gates
    // canSubmit and the calibration loader on it). It used to carry the raw
    // model output verbatim (S3 in docs/CODE_AND_SECURITY_REVIEW_2026-09.md);
    // now it's built from validated fields only. subgenre always passes
    // SubgenreSchema, so this is never empty.
    return NextResponse.json({
      analysis,
      reasoning: analysis.cause || analysis.choice || analysis.subgenre,
      cause: analysis.cause || '',
      choice: analysis.choice || '',
      subgenre: analysis.subgenre
    });

  } catch (error) {
    console.error('Matcher API error:', error);
    return NextResponse.json(
      { error: 'Failed to process emotional analysis' },
      { status: 500 }
    );
  }
}
