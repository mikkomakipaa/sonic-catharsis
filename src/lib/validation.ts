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
  duration: z.enum(DurationTypes).nullable().optional(),
  // Optional, additive: true when the intake was pre-filled from a Provoke
  // Me stimulus (lib/provocations.ts). Absent is treated as false, so older
  // clients are unaffected. The Matcher uses it for its iatrogenic note; the
  // Curator ignores it.
  provoked: z.boolean().optional(),
  // Optional, additive: Seppo's note on the patient's behaviour in the
  // Vittuilubotti chat. Only the Matcher reads it (cause prose); absent for
  // every other path.
  chatNote: z.string().max(300).nullable().optional()
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
//
// subgenre is bounded because the client echoes this object back to the
// Curator, which interpolates subgenre straight into its prompt — unbounded,
// it turned /api/curator into a free general-purpose LLM proxy (S2 in
// docs/CODE_AND_SECURITY_REVIEW_2026-09.md). 120 chars / genre-name
// characters comfortably covers every anchor in lib/genre-mapping.ts (the
// longest is 45, some contain ':' or '/'). cause/choice never reach a model
// again, but are capped so the echo can't carry an arbitrarily large body.
export const SubgenreSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[\p{L}\p{N} &'/:,.()-]+$/u, 'Invalid subgenre');

export const AnalysisSchema = z.object({
  subgenre: SubgenreSchema,
  sonic_profile: SonicProfileSchema,
  cause: z.string().max(2000).optional(),
  choice: z.string().max(2000).optional()
});

// Curator API request schema
export const CuratorRequestSchema = z.object({
  analysis: AnalysisSchema,
  emotionData: EmotionDataSchema
});

// Curator OUTPUT contract — what the model must return before anything is
// passed on to the client. Only these fields are forwarded; anything else
// the model adds is stripped. `link` is requested by CURATOR_INSTRUCTIONS
// (lib/prompts.ts) but the client builds its own Bandcamp search URL.
export const CuratorArtistSchema = z.object({
  artist: z.string().trim().min(1).max(100),
  link: z.string().max(300).nullable().optional(),
});

export const CuratorArtistsSchema = z.array(CuratorArtistSchema).min(1).max(15);

// Vittuilubotti ("Seppo", the last-resort live-chat agent after Provoke Me's
// five noes — see VITTUILUBOTTI_INSTRUCTIONS in lib/prompts.ts). The route is
// stateless: the client sends the whole transcript every turn, and the SERVER
// derives the turn number and the final-turn flag from it, so a client can't
// skip the cap. The opening greeting is hardcoded in the UI and is not part
// of the transcript.
export const MAX_VITTUILU_USER_MESSAGES = 3;
export const MAX_VITTUILU_USER_TEXT = 300;
export const MAX_VITTUILU_REPLY_TEXT = 1200;

export const VittuiluMessageSchema = z.object({
  role: z.enum(['user', 'seppo']),
  text: z.string().trim().min(1).max(MAX_VITTUILU_REPLY_TEXT),
});

// What the patient already told the assessment page (the intake form). Sent
// once with every request (the route is stateless) and used by Seppo as
// ammunition, mainly in his first reply. Every field is optional: the form
// only requires a trigger, and a re-assessment can leave any of it empty.
// The diagnosis Stage is deliberately NOT part of this.
export const VittuiluIntakeSchema = z.object({
  event: z.string().max(500).nullable().optional(),
  trigger: z.enum(TriggerTypes).nullable().optional(),
  intensity: z.number().min(0).max(10).nullable().optional(),
  symptoms: z.array(z.enum(PhysicalSymptomTypes)).max(PhysicalSymptomTypes.length).optional().default([]),
  duration: z.enum(DurationTypes).nullable().optional(),
});

export const VittuiluRequestSchema = z.object({
  intake: VittuiluIntakeSchema.optional(),
  messages: z
    .array(VittuiluMessageSchema)
    .min(1)
    .max(MAX_VITTUILU_USER_MESSAGES * 2)
    .superRefine((messages, ctx) => {
      if (messages[messages.length - 1].role !== 'user') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Last message must be from the user' });
      }
      if (messages.some((m) => m.role === 'user' && m.text.length > MAX_VITTUILU_USER_TEXT)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `User messages are capped at ${MAX_VITTUILU_USER_TEXT} characters` });
      }
      if (messages.filter((m) => m.role === 'user').length > MAX_VITTUILU_USER_MESSAGES) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Too many user messages' });
      }
    }),
});

// Seppo's verdict, delivered with his last message: the intake values the
// app then diagnoses from, in place of the patient filling the form in
// again. Same closed vocabularies as the assessment form (EmotionDataSchema).
export const VittuiluAssessmentSchema = z.object({
  trigger: z.enum(TriggerTypes),
  intensity: z.number().min(0).max(10).transform((n) => Math.round(n)),
  symptoms: z.array(z.enum(PhysicalSymptomTypes)).max(PhysicalSymptomTypes.length).optional().default([]),
  duration: z.enum(DurationTypes),
  // One first-person sentence in the patient's voice, fed to the Matcher
  // as the incident text.
  incident: z.string().trim().min(1).max(500),
  // Seppo's clinical note on how the patient behaved in the chat. Rides along
  // to the Matcher so the Observation can use the conversation, not only the
  // iatrogenic flag. Optional: a missing or malformed note degrades to
  // undefined and never costs the patient the verdict.
  // Over-length is cut to fit rather than dropped, since the model drifts past
  // the limit it is given far more often than it omits the note.
  observation_note: z
    .preprocess((v) => (typeof v === 'string' ? v.trim().slice(0, 300) : v), z.string().min(1))
    .optional()
    .catch(undefined),
});

// Stimulus assessment ("Joko vituttaa?" → yes): the stimulus only supplies a
// trigger and an incident, so the model reads off how annoyed the patient is
// and the app submits straight to the analysis instead of pre-filling the
// intake form. Duration ("just now") and symptoms (none) aren't asked of it.
export const AssessRequestSchema = z.object({
  trigger: z.enum(TriggerTypes),
  incident: z.string().trim().min(1).max(500),
});
export const AssessReplySchema = z.object({
  intensity: z.number().min(0).max(10).transform((n) => Math.round(n)),
});

// Vittuilubotti OUTPUT contract. Only `reply`, `end_chat` and (on the final
// turn) `assessment` leave the server.
export const VittuiluReplySchema = z.object({
  reply: z.string().trim().min(1).max(MAX_VITTUILU_REPLY_TEXT),
  end_chat: z.boolean().optional().default(false),
  // A malformed verdict must never cost the patient Seppo's reply: it
  // degrades to null and the client falls back to the manual button.
  assessment: VittuiluAssessmentSchema.nullable().optional().catch(null),
});

export type VittuiluAssessment = z.infer<typeof VittuiluAssessmentSchema>;

export type VittuiluMessage = z.infer<typeof VittuiluMessageSchema>;
export type VittuiluIntake = z.input<typeof VittuiluIntakeSchema>;

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
