import OpenAI from 'openai';
import { z } from 'zod';

// Created lazily on first request, not at module scope — module scope runs
// during Next.js's build-time "Collecting page data" step, before
// OPENAI_API_KEY is necessarily available, and the SDK throws immediately
// on a missing key, failing the build itself. Memoized after that so a warm
// function instance reuses one client (and its connection pool).
const ServerEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
});

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const env = ServerEnvSchema.safeParse(process.env);
    if (!env.success) {
      // Named explicitly so a misconfigured deploy is obvious in the logs
      // rather than surfacing as a generic OpenAI auth failure.
      throw new Error('OPENAI_API_KEY is not set');
    }
    client = new OpenAI({ apiKey: env.data.OPENAI_API_KEY });
  }
  return client;
}
