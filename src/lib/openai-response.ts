import type { Response } from 'openai/resources/responses/responses';

// Shared by both API routes (C4/C5/C6 in docs/CODE_AND_SECURITY_REVIEW_2026-09.md).
// Both prompts instruct the model to return a single JSON object. When it
// doesn't, the routes retry once and then fail loudly — they never salvage
// prose with keyword heuristics or invent placeholder results, since a
// made-up diagnosis or fake band shown as real is worse than a retry prompt.

// `output_text` is the SDK's convenience aggregate; fall back to walking
// `output` for message text in case it's empty.
export function getResponseText(response: Pick<Response, 'output_text' | 'output'>): string {
  if (response.output_text) return response.output_text;
  for (const item of response.output ?? []) {
    if (item.type !== 'message' || !Array.isArray(item.content)) continue;
    const text = item.content.find((c) => c.type === 'output_text');
    if (text && text.type === 'output_text' && text.text) return text.text;
  }
  return '';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// First '{' to last '}' — tolerates a model that wraps its JSON in a
// sentence or a code fence.
export function extractJsonObject(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Calls the model up to `attempts` times, returning the first response
// `accept` turns into a non-null value. OpenAI API errors are not retried
// here — they propagate to the route's catch.
export async function createWithRetry<T>(
  create: () => Promise<Pick<Response, 'output_text' | 'output'>>,
  accept: (json: Record<string, unknown>) => T | null,
  attempts = 2
): Promise<T | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const json = extractJsonObject(getResponseText(await create()));
    const accepted = json ? accept(json) : null;
    if (accepted !== null) return accepted;
  }
  return null;
}
