import { NextRequest, NextResponse } from 'next/server';
import { SeppoNotesRequestSchema, SeppoNotesSchema, validateRequest } from '@/lib/validation';
import { SEPPO_ARTIST_NOTES_INSTRUCTIONS } from '@/lib/prompts';
import { createWithRetry } from '@/lib/openai-response';
import { getOpenAI } from '@/lib/openai-client';

const SEPPO_NOTES_MODEL = 'gpt-4.1';

// Newlines are flattened so the incident can't forge an extra input line.
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

// Stateless and single-shot: the Curator's artist names plus the subgenre (and
// the incident, as material) in, a bounded list of { artist, note } out. The
// Curator itself stays blind to the incident; Seppo is the only agent that
// sees both. Model output is untrusted: notes are matched back to the
// requested artists, so a made-up or duplicated name never reaches the client.
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const validation = validateRequest(SeppoNotesRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { artists, subgenre, incident } = validation.data!;

    const input = [
      `subgenre: ${subgenre}`,
      ...(incident ? [`incident: ${oneLine(incident)}`] : []),
      'artists:',
      ...artists.map((name, i) => `${i + 1}. ${oneLine(name)}`),
    ].join('\n');

    const notes = await createWithRetry(
      () => getOpenAI().responses.create({
        model: SEPPO_NOTES_MODEL,
        instructions: SEPPO_ARTIST_NOTES_INSTRUCTIONS,
        input,
        temperature: 1,
        max_output_tokens: 1200,
      }),
      (json) => {
        const parsed = SeppoNotesSchema.safeParse(json.notes);
        return parsed.success ? parsed.data : null;
      }
    );

    if (!notes) {
      console.error('Seppo notes: no valid notes in model response after retry');
      return NextResponse.json({ error: 'Seppo is unavailable' }, { status: 500 });
    }

    const wanted = new Set(artists.map((a) => a.toLowerCase()));
    const seen = new Set<string>();
    const accepted = notes.filter(({ artist }) => {
      const key = artist.toLowerCase();
      if (!wanted.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ notes: accepted });
  } catch (error) {
    console.error('Seppo notes API error:', error);
    return NextResponse.json({ error: 'Failed to reach Seppo' }, { status: 500 });
  }
}
