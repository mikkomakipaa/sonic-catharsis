import { z } from 'zod';

// Plutchik's 8 basic emotions, as 4 opposing pairs
export const CoreEmotions = [
  'joy', 'trust', 'fear', 'surprise',
  'sadness', 'disgust', 'anger', 'anticipation'
] as const;

// Metal subgenres
export const MetalSubgenres = [
  'death', 'black', 'power', 'doom', 'thrash',
  'progressive', 'symphonic', 'folk', 'industrial', 'nu-metal'
] as const;

// Emotion data validation schema
export const EmotionDataSchema = z.object({
  primary: z.enum(CoreEmotions, {
    errorMap: () => ({ message: 'Invalid emotion type' })
  }),
  stressLevel: z.number().min(0).max(10).nullable().optional(), // 0-10 to match mapping matrix
  event: z.string().max(500).nullable().optional()
});

// Matcher API request schema
export const MatcherRequestSchema = z.object({
  emotionData: EmotionDataSchema
});

// Analysis result schema
export const AnalysisSchema = z.object({
  subgenre: z.string(),
  primary_emotion: z.string(),
  stress_level: z.union([z.number(), z.string()]),
  cause: z.string().optional(),
  choice: z.string().optional()
});

// Curator API request schema
export const CuratorRequestSchema = z.object({
  analysis: AnalysisSchema,
  emotionData: EmotionDataSchema
});

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`
      };
    }
    return { success: false, error: 'Invalid request data' };
  }
}
