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
import { MUSIC_GENRE_IDS, getMusicGenre } from '@/lib/music-prep';
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
    genre: { type: 'string', enum: [...MUSIC_GENRE_IDS] },
  };
  if (isOpening) {
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

// "Prepare me for the music": one reply of the scene. Stateless (the client
// resends the transcript). Turn 0 (no messages) is Seppo's opening: he mocks
// the patient's favorite genre and the model picks the metal part, returned as
// `genre`. After that the client sends that genre back and it stays fixed.
// Turn and final-turn flag are derived here, never taken from the client,
// because the cap is what bounds the cost of this unauthenticated paid-model
// route (covered by the Vercel WAF rate limit).
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
    const { favorite, genre, messages } = validation.data!;

    const turn = messages.filter((m) => m.role === 'user').length;
    const isFinalTurn = turn >= MAX_SCENE_USER_MESSAGES;

    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Seppo'}: ${oneLine(m.text)}`)
      .join('\n');

    const result = await createWithRetry(
      () => getOpenAI().responses.create({
        model: SCENE_MODEL,
        instructions: sceneInstructions(genre),
        input: `favorite_genre: ${JSON.stringify(favorite)}\n${genre ? `genre: ${genre}\n` : ''}turn: ${turn} of ${MAX_SCENE_USER_MESSAGES}\nis_final_turn: ${isFinalTurn}\n${transcript ? `transcript:\n${transcript}` : 'transcript: (none, write the opening)'}`,
        text: { format: replyFormat(!genre) },
        temperature: 1,
        max_output_tokens: 600,
      }),
      (json) => {
        const parsed = SceneReplySchema.safeParse(json);
        // The opening must name its part; later turns keep the one given.
        return parsed.success && (genre || parsed.data.genre) ? parsed.data : null;
      }
    );

    if (!result) {
      console.error('Scene: no valid reply in model response after retry');
      return NextResponse.json({ error: 'Seppo is unavailable' }, { status: 500 });
    }

    // Only these fields leave the server. The opening also hands over the
    // sound the Curator will use: the model's own pick, or the genre table's
    // entry for its part when the model's subgenre or profile was unusable
    // (as the Matcher does).
    const chosen = genre ?? result.genre!;
    const sound = genre
      ? {}
      : {
          subgenre: result.subgenre ?? getMusicGenre(chosen).subgenre,
          sonic_profile: result.sonic_profile ?? getMusicGenre(chosen).sonicProfile,
        };
    return NextResponse.json({
      reply: result.reply,
      end_scene: isFinalTurn || result.end_scene,
      genre: chosen,
      ...sound,
      ...(result.scene_summary ? { scene_summary: result.scene_summary } : {}),
    });
  } catch (error) {
    console.error('Scene API error:', error);
    return NextResponse.json({ error: 'Failed to reach Seppo' }, { status: 500 });
  }
}
