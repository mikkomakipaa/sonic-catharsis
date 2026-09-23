import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AnalysisSchema, MatcherRequestSchema, validateRequest } from '@/lib/validation';
import { getDeterministicGenre } from '@/lib/genre-mapping';
import { STRESS_VALUE_TO_LABEL, getActiveStage, STAGES } from '@/lib/theme';
import { MATCHER_INSTRUCTIONS } from '@/lib/prompts';

const MATCHER_MODEL = 'gpt-4.1';

// Matches "Stage <roman>" optionally followed by "— <Finnish stage name>",
// so any wrong stage the model names in cause/choice prose (it's told to
// name the condition, but nothing stops it hallucinating a different one —
// e.g. writing "Stage I — Lievä ärsytys" while the app's own rail/header
// show Stage II) gets corrected to the one actually diagnosed, the same
// safety-net spirit as the subgenre fallback below.
const STAGE_NAMES_PATTERN = STAGES.map((s) => s.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const CONDITION_MENTION_PATTERN = new RegExp(
  `Stage\\s+(?:I|II|III|IV|V|VI|VII|VIII|IX)(?:\\s*[—-]\\s*(?:${STAGE_NAMES_PATTERN}))?`,
  'gi'
);

function enforceCondition(text: string, condition: string): string {
  if (!text) return text;
  return text.replace(CONDITION_MENTION_PATTERN, condition);
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

    // The same deterministic (emotion, stress) -> Stage lookup the analysis
    // screen already uses for its "Diagnosis: EMOTION, Code {roman}" display
    // — computed again here so the model can be told the exact condition
    // name it's expected to reference, in sync with what's on screen.
    const stage = getActiveStage(emotionData.primary, emotionData.stressLevel ?? null);
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
      ? `\n\nSPECIAL CASE: The event description is trivial ("${trimmedEvent || 'nothing typed at all'}") yet the app has diagnosed the most severe stage there is (${condition}). For "cause" ONLY, do not invent drama about the event — instead call out this exact mismatch directly, in the same dark comic voice: how little was given versus how much the app is dramatizing it. Keep "choice" normal.`
      : '';

    // Use OpenAI Responses API with in-repo instructions (no hosted Prompt
    // Object) — variables are embedded directly in the input text instead.
    const response = await openai.responses.create({
      model: MATCHER_MODEL,
      instructions: MATCHER_INSTRUCTIONS,
      input: `legacy_emotion: ${emotionData.primary}\ntrigger: ${emotionData.trigger}\nstress_level: ${stressLabel}\ncondition: ${condition}\nevent: ${emotionData.event || 'none'}\nanchor_subgenre: ${anchorGenre.genre}\n\nKeep "cause" and especially "choice" SHORT and punchy: 2-3 sentences max, no purple prose, no run-on sentences. Name the condition ("${condition}") directly at least once across the two fields.${gapDirective}`,
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
    } catch (error) {
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

    // Correct any wrong stage the model named — cause/choice text is prose
    // the model writes freely, so it can drift from `condition` (the one
    // fact that must match what's already on screen) even though the model
    // is instructed to use it verbatim.
    analysisResult.cause = enforceCondition(analysisResult.cause, condition);
    analysisResult.choice = enforceCondition(analysisResult.choice, condition);

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