import { z } from 'zod';

// 8 basic emotions, as 4 opposing pairs
export const CoreEmotions = [
  'joy', 'trust', 'fear', 'surprise',
  'sadness', 'disgust', 'anger', 'anticipation'
] as const;

// Metal subgenres
export const MetalSubgenres = [
  'death', 'black', 'power', 'doom', 'thrash',
  'progressive', 'symphonic', 'folk', 'industrial', 'nu-metal'
] as const;

// The 8 frustration trigger types, mirroring TriggerType (src/types/index.ts)
// as a runtime-checkable const array, same pattern as CoreEmotions above.
export const TriggerTypes = [
  'injustice', 'failure', 'conflict', 'helplessness', 'overload',
  'exhaustion', 'uncertainty', 'absurdity',
] as const;

// Mirrors PhysicalSymptomType (src/types/index.ts) / PHYSICAL_SYMPTOMS
// (lib/symptoms.ts) — optional, multi-select, so the schema field below
// defaults to an empty array rather than being nullable like the others.
export const PhysicalSymptomTypes = [
  'head_exploding', 'muscle_tension', 'heart_pounding',
  'accelerated_breathing', 'weakness', 'legs_limp',
] as const;

// Mirrors DurationType (src/types/index.ts) / DURATION_TIERS
// (lib/duration.ts) — optional, single-select, defaults to the "no
// duration reported" tier rather than being nullable, same reasoning as
// PhysicalSymptomTypes above.
export const DurationTypes = [
  'just_now', 'about_hour', 'several_hours', 'since_yesterday', 'several_days',
] as const;

// Emotion data validation schema
export const EmotionDataSchema = z.object({
  primary: z.enum(CoreEmotions, {
    errorMap: () => ({ message: 'Invalid emotion type' })
  }),
  // The user's actual selected category — sent alongside `primary` (its lossy
  // legacy-emotion translation) so the Matcher can reason from what the user
  // really chose, not just its compatibility-shim mapping. See lib/trigger.ts.
  trigger: z.enum(TriggerTypes, {
    errorMap: () => ({ message: 'Invalid trigger type' })
  }),
  stressLevel: z.number().min(0).max(10).nullable().optional(), // 0-10 to match mapping matrix
  event: z.string().max(500).nullable().optional(),
  symptoms: z.array(z.enum(PhysicalSymptomTypes)).optional().default([]),
  // No default — null/undefined means the person never touched the
  // control, same as `stressLevel`. Never silently treated as "Fresh";
  // see lib/theme.ts and lib/prompts.ts for how an absent duration is
  // handled downstream.
  duration: z.enum(DurationTypes).nullable().optional()
});

// Matcher API request schema
export const MatcherRequestSchema = z.object({
  emotionData: EmotionDataSchema
});

// Sonic profile: 5 closed-vocabulary dimensions the Matcher derives from
// incident text + trigger + intensity, calibrating both subgenre choice
// and the Curator's picks within that subgenre. Each is an ordered enum
// (least -> most intense) so it's usable as structured calibration input, not
// free prose the model could phrase inconsistently. Dimension counts are
// deliberately not forced to match (4 for most, 5 for weight) — matching real
// distinctions rather than symmetry for its own sake.
export const ActivationLevels = ['restrained', 'driving', 'aggressive', 'overwhelming'] as const;
export const AgencyLevels = ['surrender', 'immersion', 'assertion', 'confrontation'] as const;
export const FrictionLevels = ['smooth', 'textured', 'abrasive', 'confrontational'] as const;
export const CognitiveDensityLevels = ['direct', 'primitive', 'complex', 'disorienting'] as const;
export const WeightLevels = ['light', 'propulsive', 'heavy', 'oppressive', 'crushing'] as const;

export const SonicProfileSchema = z.object({
  activation: z.enum(ActivationLevels),
  agency: z.enum(AgencyLevels),
  friction: z.enum(FrictionLevels),
  cognitive_density: z.enum(CognitiveDensityLevels),
  weight: z.enum(WeightLevels),
});

// Analysis result schema — the Matcher's OUTPUT contract. No primary_emotion/
// stress_level here: the app already has those values client-side, so the
// LLM isn't asked to echo them back (state-transport anti-pattern). subgenre
// is now the model's own reasoned pick (informed by an anchor, not dictated
// by one) rather than an echoed deterministic value.
export const AnalysisSchema = z.object({
  subgenre: z.string(),
  sonic_profile: SonicProfileSchema,
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
