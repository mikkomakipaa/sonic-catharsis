import { NextRequest, NextResponse } from 'next/server';
import {
  MAX_VITTUILU_USER_MESSAGES,
  VittuiluReplySchema,
  VittuiluRequestSchema,
  validateRequest,
} from '@/lib/validation';
import { VITTUILUBOTTI_INSTRUCTIONS } from '@/lib/prompts';
import { createWithRetry } from '@/lib/openai-response';
import { getOpenAI } from '@/lib/openai-client';
import { MAX_STIMULI_PER_SESSION } from '@/lib/provocations';
import { getTriggerMeta } from '@/lib/trigger';
import { getSymptomMeta } from '@/lib/symptoms';
import { getDurationMeta } from '@/lib/duration';
import type { VittuiluIntake } from '@/lib/validation';

const VITTUILU_MODEL = 'gpt-4.1';

// Newlines are flattened so a user message can't forge a "Seppo:" line in
// the transcript the model reads.
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

// Renders the assessment-page answers as flat "key: value" lines for the
// model. Free text is flattened like the transcript; the rest comes from
// closed vocabularies. Returns '' when the patient gave nothing.
function renderIntake(intake: VittuiluIntake | undefined): string {
  if (!intake) return '';
  const lines: string[] = [];
  const event = intake.event ? oneLine(intake.event) : '';
  if (event) lines.push(`intake_incident: ${event}`);
  if (intake.trigger) lines.push(`intake_trigger: ${getTriggerMeta(intake.trigger).label}`);
  if (typeof intake.intensity === 'number') lines.push(`intake_intensity: ${intake.intensity} of 10`);
  if (intake.symptoms?.length) lines.push(`intake_symptoms: ${intake.symptoms.map((s) => getSymptomMeta(s).label).join(', ')}`);
  if (intake.duration) lines.push(`intake_duration: ${getDurationMeta(intake.duration).label}`);
  return lines.length ? `${lines.join('\n')}\n` : '';
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const validation = validateRequest(VittuiluRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { messages, intake } = validation.data!;

    // Turn number and the final-turn flag are derived here, never trusted
    // from the client — the cap is what bounds the cost of this route.
    const turn = messages.filter((m) => m.role === 'user').length;
    const isFinalTurn = turn >= MAX_VITTUILU_USER_MESSAGES;

    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Seppo'}: ${oneLine(m.text)}`)
      .join('\n');

    // The model is pushed to its most unhinged here, so sampling is left
    // hot on purpose; max_output_tokens is a second guard on top of the
    // reply schema's length cap. Model output is untrusted: only a bounded
    // { reply, end_chat, assessment } (VittuiluReplySchema) leaves the server.
    const result = await createWithRetry(
      () => getOpenAI().responses.create({
        model: VITTUILU_MODEL,
        instructions: VITTUILUBOTTI_INSTRUCTIONS,
        input: `stimuli_declined: ${MAX_STIMULI_PER_SESSION}\nturn: ${turn} of ${MAX_VITTUILU_USER_MESSAGES}\nis_final_turn: ${isFinalTurn}\n${renderIntake(intake)}transcript:\n${transcript}`,
        temperature: 1,
        max_output_tokens: 900,
      }),
      (json) => {
        const parsed = VittuiluReplySchema.safeParse(json);
        return parsed.success ? parsed.data : null;
      }
    );

    if (!result) {
      console.error('Vittuilu: no valid reply in model response after retry');
      return NextResponse.json({ error: 'Seppo is unavailable' }, { status: 500 });
    }

    if ((isFinalTurn || result.end_chat) && result.assessment && !result.observation_note) {
      console.warn('Vittuilu: final assessment carried no observation_note');
    }

    // Only the closing message carries a verdict, with Seppo's note attached.
    // Absent (e.g. the self-harm drop-out) the client falls back to the manual button.
    const ended = isFinalTurn || result.end_chat;
    const verdict = ended && result.assessment
      ? { ...result.assessment, ...(result.observation_note ? { observation_note: result.observation_note } : {}) }
      : null;

    return NextResponse.json({
      reply: result.reply,
      end_chat: isFinalTurn || result.end_chat,
      assessment: verdict,
      // Also sent on its own: when the model botches the verdict object, the
      // manual "re-assess me" path still carries the note to the Observation.
      ...(ended && result.observation_note ? { observation_note: result.observation_note } : {}),
    });
  } catch (error) {
    console.error('Vittuilu API error:', error);
    return NextResponse.json({ error: 'Failed to reach Seppo' }, { status: 500 });
  }
}
