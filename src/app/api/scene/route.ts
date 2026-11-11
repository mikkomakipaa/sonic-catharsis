import { NextRequest, NextResponse } from 'next/server';
import {
  MAX_SCENE_USER_MESSAGES,
  SceneReplySchema,
  SceneRequestSchema,
  validateRequest,
} from '@/lib/validation';
import { sceneInstructions } from '@/lib/prompts';
import { createWithRetry } from '@/lib/openai-response';
import { getOpenAI } from '@/lib/openai-client';
import { getMusicGenre, getSceneOpening } from '@/lib/music-prep';

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
    required: ['reply', 'end_scene', 'scene_summary'],
    properties: {
      reply: { type: 'string' },
      end_scene: { type: 'boolean' },
      scene_summary: { type: 'string' },
    },
  },
};

// Newlines are flattened so a user message can't forge a "Seppo:" line in
// the transcript the model reads.
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

// "Prepare me for the music": one reply of the scene. Stateless (the client
// resends the transcript); turn and final-turn flag are derived here, never
// taken from the client, because the cap is what bounds the cost of this
// unauthenticated paid-model route (covered by the Vercel WAF rate limit).
// Seppo's hand-written opening is prepended from the genre table, never
// trusted from the client.
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
    const { genre, referenceArtist, messages } = validation.data!;

    const turn = messages.filter((m) => m.role === 'user').length;
    const isFinalTurn = turn >= MAX_SCENE_USER_MESSAGES;

    const transcript = [
      `Seppo: ${oneLine(getSceneOpening(genre))}`,
      ...messages.map((m) => `${m.role === 'user' ? 'User' : 'Seppo'}: ${oneLine(m.text)}`),
    ].join('\n');

    const result = await createWithRetry(
      () => getOpenAI().responses.create({
        model: SCENE_MODEL,
        instructions: sceneInstructions(genre),
        input: `genre: ${getMusicGenre(genre).label}\nturn: ${turn} of ${MAX_SCENE_USER_MESSAGES}\nis_final_turn: ${isFinalTurn}\n${referenceArtist ? `reference_artist: ${JSON.stringify(referenceArtist)}\n` : ''}transcript:\n${transcript}`,
        text: { format: SCENE_FORMAT },
        temperature: 1,
        max_output_tokens: 600,
      }),
      (json) => {
        const parsed = SceneReplySchema.safeParse(json);
        return parsed.success ? parsed.data : null;
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
      ...(result.scene_summary ? { scene_summary: result.scene_summary } : {}),
    });
  } catch (error) {
    console.error('Scene API error:', error);
    return NextResponse.json({ error: 'Failed to reach Seppo' }, { status: 500 });
  }
}
