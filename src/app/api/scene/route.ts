import { NextRequest, NextResponse } from 'next/server';
import {
  MAX_SCENE_USER_MESSAGES,
  SceneReplySchema,
  SceneRequestSchema,
  validateRequest,
} from '@/lib/validation';
import { MUSIC_GENRE_IDS } from '@/lib/music-prep';
import { sceneInstructions } from '@/lib/prompts';
import { createWithRetry } from '@/lib/openai-response';
import { getOpenAI } from '@/lib/openai-client';

const SCENE_MODEL = 'gpt-4.1';

// Strict structured output, as in /api/vittuilu. The Zod schema
// (SceneReplySchema) still validates what comes back.
const SCENE_FORMAT = {
  type: 'json_schema' as const,
  name: 'seppo_scene_reply',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['reply', 'end_scene', 'scene_summary', 'genre'],
    properties: {
      reply: { type: 'string' },
      end_scene: { type: 'boolean' },
      scene_summary: { type: 'string' },
      genre: { type: 'string', enum: [...MUSIC_GENRE_IDS] },
    },
  },
};

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
        text: { format: SCENE_FORMAT },
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

    // Only these fields leave the server.
    return NextResponse.json({
      reply: result.reply,
      end_scene: isFinalTurn || result.end_scene,
      genre: genre ?? result.genre,
      ...(result.scene_summary ? { scene_summary: result.scene_summary } : {}),
    });
  } catch (error) {
    console.error('Scene API error:', error);
    return NextResponse.json({ error: 'Failed to reach Seppo' }, { status: 500 });
  }
}
