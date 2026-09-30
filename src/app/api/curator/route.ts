import { NextRequest, NextResponse } from 'next/server';
import { CuratorArtistsSchema, CuratorRequestSchema, validateRequest } from '@/lib/validation';
import { CURATOR_INSTRUCTIONS } from '@/lib/prompts';
import { createWithRetry } from '@/lib/openai-response';
import { getOpenAI } from '@/lib/openai-client';

const CURATOR_MODEL = 'gpt-4.1';

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    // Validate request data
    const validation = validateRequest(CuratorRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // emotionData is validated (CuratorRequestSchema) but intentionally
    // unused — see the comment below.
    const { analysis } = validation.data!;

    // Always non-empty: SubgenreSchema requires min(1).
    const subgenre = analysis.subgenre;
    const sonicProfile = analysis.sonic_profile;

    // Curator gets only the finished sonic direction — no emotion, stress
    // label, condition, or event. That interpretation work is entirely the
    // Matcher's job now; Curator's job is purely "given this sound, find 10
    // real matching artists." `emotionData` is still accepted on the request
    // (CuratorRequestSchema) and unused here — see validation.ts for why it's
    // kept rather than trimmed.
    //
    // Trying the model's own artist knowledge unconstrained by a code-side
    // candidate pool — see the note in lib/prompts.ts for why.
    //
    // One retry if the reply isn't a valid Selection; see
    // lib/openai-response.ts. Model output is untrusted: only a bounded list
    // of {artist, link} (CuratorArtistsSchema) ever leaves the server.
    const artists = await createWithRetry(
      () => getOpenAI().responses.create({
        model: CURATOR_MODEL,
        instructions: CURATOR_INSTRUCTIONS,
        input: `subgenre: ${subgenre}\nactivation: ${sonicProfile.activation}\nagency: ${sonicProfile.agency}\nfriction: ${sonicProfile.friction}\ncognitive_density: ${sonicProfile.cognitive_density}\nweight: ${sonicProfile.weight}`,
      }),
      (json) => {
        const parsed = CuratorArtistsSchema.safeParse(json.Selection);
        return parsed.success ? parsed.data : null;
      }
    );

    if (!artists) {
      console.error('Curator: no valid Selection in model response after retry');
      return NextResponse.json(
        { error: 'No structured playlist received' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      artists,
      type: 'artists'
    });

  } catch (error) {
    console.error('Curator API error:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
