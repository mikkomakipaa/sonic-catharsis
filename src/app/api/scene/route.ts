import { NextRequest, NextResponse } from 'next/server';
import {
  ActivationLevels,
  AgencyLevels,
  CognitiveDensityLevels,
  FrictionLevels,
  WeightLevels,
  MAX_SCENE_USER_MESSAGES,
  SceneReplySchema,
  SceneRequestSchema,
  validateRequest,
} from '@/lib/validation';
import { sceneInstructions } from '@/lib/prompts';
import { createWithRetry } from '@/lib/openai-response';
import { getOpenAI } from '@/lib/openai-client';

const SCENE_MODEL = 'gpt-4.1';

// Strict structured output, as in /api/vittuilu. The opening also carries the
// sound (subgenre + sonic profile); later turns only need reply fields. The
// Zod schema (SceneReplySchema) still validates what comes back.
function replyFormat(isOpening: boolean) {
  const properties: Record<string, unknown> = {
    reply: { type: 'string' },
    end_scene: { type: 'boolean' },
    scene_summary: { type: 'string' },
  };
  if (isOpening) {
    properties.performance = { type: 'string' };
    properties.subgenre = { type: 'string' };
    properties.sonic_profile = {
      type: 'object',
      additionalProperties: false,
      required: ['activation', 'agency', 'friction', 'cognitive_density', 'weight'],
      properties: {
        activation: { type: 'string', enum: [...ActivationLevels] },
        agency: { type: 'string', enum: [...AgencyLevels] },
        friction: { type: 'string', enum: [...FrictionLevels] },
        cognitive_density: { type: 'string', enum: [...CognitiveDensityLevels] },
        weight: { type: 'string', enum: [...WeightLevels] },
      },
    };
  }
  return {
    type: 'json_schema' as const,
    name: isOpening ? 'seppo_scene_opening' : 'seppo_scene_reply',
    strict: true,
    schema: { type: 'object', additionalProperties: false, required: Object.keys(properties), properties },
  };
}

// Newlines are flattened so a user message can't forge a "Seppo:" line in
// the transcript the model reads.
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

// Stateless scene: the opening invents a performance and sound. Later calls
// carry the saved performance, subgenre, summary and transcript as data.
// Turn and final-turn status are derived server-side to bound model calls.
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const validation = validateRequest(SceneRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { favorite, performance, subgenre, scene_summary, messages } = validation.data!;
    const isOpening = messages.length === 0;

    const turn = messages.filter((m) => m.role === 'user').length;
    const isFinalTurn = turn >= MAX_SCENE_USER_MESSAGES;

    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Seppo'}: ${oneLine(m.text)}`)
      .join('\n');

    const result = await createWithRetry(
      () => getOpenAI().responses.create({
        model: SCENE_MODEL,
        instructions: sceneInstructions(isOpening),
        input: `favorite_genre: ${JSON.stringify(favorite)}\n${!isOpening ? `performance: ${JSON.stringify(performance)}\nprescribed_subgenre: ${JSON.stringify(subgenre)}\nscene_summary: ${JSON.stringify(scene_summary ?? '')}\n` : ''}turn: ${turn} of ${MAX_SCENE_USER_MESSAGES}\nis_final_turn: ${isFinalTurn}\n${transcript ? `transcript:\n${transcript}` : 'transcript: (none, write the opening)'}`,
        text: { format: replyFormat(isOpening) },
        temperature: 1,
        max_output_tokens: 600,
      }),
      (json) => {
        const parsed = SceneReplySchema.safeParse(json);
        // The opening must provide a complete, valid performance and sound.
        return parsed.success && (!isOpening || (parsed.data.performance && parsed.data.subgenre && parsed.data.sonic_profile)) ? parsed.data : null;
      }
    );

    if (!result) {
      console.error('Scene: no valid reply in model response after retry');
      return NextResponse.json({ error: 'Seppo is unavailable' }, { status: 500 });
    }

    // The opening requires a complete valid sound and performance. Retrying
    // instead of substituting an unrelated preset keeps the reply and cure aligned.
    return NextResponse.json({
      reply: result.reply,
      end_scene: isFinalTurn || result.end_scene,
      ...(isOpening ? { performance: result.performance, subgenre: result.subgenre, sonic_profile: result.sonic_profile } : {}),
      ...(result.scene_summary ? { scene_summary: result.scene_summary } : {}),
    });
  } catch (error) {
    console.error('Scene API error:', error);
    return NextResponse.json({ error: 'Failed to reach Seppo' }, { status: 500 });
  }
}
