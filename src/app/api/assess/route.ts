import { NextRequest, NextResponse } from 'next/server';
import { AssessReplySchema, AssessRequestSchema, validateRequest } from '@/lib/validation';
import { ASSESSOR_INSTRUCTIONS } from '@/lib/prompts';
import { createWithRetry } from '@/lib/openai-response';
import { getOpenAI } from '@/lib/openai-client';
import { getTriggerMeta } from '@/lib/trigger';

const ASSESS_MODEL = 'gpt-4.1';

// Stateless, single-shot: trigger + incident in, a bounded { intensity } out.
// Model output is untrusted; only the schema-validated integer leaves.
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const validation = validateRequest(AssessRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { trigger, incident } = validation.data!;

    const result = await createWithRetry(
      () => getOpenAI().responses.create({
        model: ASSESS_MODEL,
        instructions: ASSESSOR_INSTRUCTIONS,
        input: `trigger: ${getTriggerMeta(trigger).label}\nincident: ${incident.replace(/\s+/g, ' ').trim()}`,
        temperature: 0.3,
        max_output_tokens: 50,
      }),
      (json) => {
        const parsed = AssessReplySchema.safeParse(json);
        return parsed.success ? parsed.data : null;
      }
    );

    if (!result) {
      console.error('Assess: no valid reply in model response after retry');
      return NextResponse.json({ error: 'Assessment unavailable' }, { status: 500 });
    }
    return NextResponse.json({ intensity: result.intensity });
  } catch (error) {
    console.error('Assess API error:', error);
    return NextResponse.json({ error: 'Failed to assess' }, { status: 500 });
  }
}
