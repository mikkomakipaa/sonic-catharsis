import { NextRequest, NextResponse } from 'next/server';
import { SeppoNotesRequestSchema, SeppoNotesSchema, validateRequest } from '@/lib/validation';
import { createWithRetry } from '@/lib/openai-response';
import { getOpenAI } from '@/lib/openai-client';
import { STRESS_VALUE_TO_LABEL, getActiveStage } from '@/lib/theme';
import { getSymptomMeta } from '@/lib/symptoms';
import { SEPPO_PEAK_PRAISE_ADDENDUM } from '@/lib/prompts';
import { getDurationMeta } from '@/lib/duration';

const ARTIST_NOTES_MODEL = 'gpt-4.1';

// Newlines are flattened so the incident can't forge an extra input line.
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

// At Stage IX both voices (physician, Seppo) switch to one: Seppo's tearful praise.
// Shared by /api/seppo-notes and /api/physician-notes: the same stateless,
// single-shot job in two voices. The Curator's artist names plus the subgenre
// (and the incident, as material) in, a bounded list of { artist, note } out.
// The Curator itself stays blind to the incident; the note writers are the
// only agents that see both. Model output is untrusted: notes are matched back
// to the requested artists, so a made-up or duplicated name never reaches the
// client. `label` only names the route in logs.
export async function handleArtistNotes(request: NextRequest, instructions: string, label: string) {
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
    const { artists, subgenre, incident, trigger, stressLevel, symptoms, duration, chatNote } = validation.data!;

    // Easter egg: at Stage IX the notes turn into gushing praise.
    // Derived here from the same intake fields as the Matcher's stage, not
    // taken on the client's word.
    const peak = getActiveStage(stressLevel ?? null, symptoms ?? [], duration ?? null).index === 9;

    const input = [
      `subgenre: ${subgenre}`,
      ...(incident ? [`incident: ${oneLine(incident)}`] : []),
      ...(trigger ? [`trigger: ${trigger}`] : []),
      ...(stressLevel != null ? [`stress_level: ${STRESS_VALUE_TO_LABEL[stressLevel] ?? stressLevel}`] : []),
      ...(symptoms?.length ? [`physical_symptoms: ${symptoms.map((s) => getSymptomMeta(s).label).join(', ')}`] : []),
      ...(duration ? [`duration_persistence: ${getDurationMeta(duration).label}`] : []),
      ...(chatNote ? [`chat_note: ${oneLine(chatNote)}`] : []),
      'artists:',
      ...artists.map((name, i) => `${i + 1}. ${oneLine(name)}`),
    ].join('\n');

    const notes = await createWithRetry(
      () => getOpenAI().responses.create({
        model: ARTIST_NOTES_MODEL,
        instructions: peak ? instructions + SEPPO_PEAK_PRAISE_ADDENDUM : instructions,
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
      console.error(`${label}: no valid notes in model response after retry`);
      return NextResponse.json({ error: 'Notes unavailable' }, { status: 500 });
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
    console.error(`${label} API error:`, error);
    return NextResponse.json({ error: 'Failed to write notes' }, { status: 500 });
  }
}
