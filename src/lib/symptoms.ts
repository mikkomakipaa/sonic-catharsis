// Physical symptoms — the real bodily-sensation items the (tongue-in-cheek)
// Vitutus study actually measured, per the same academic instrument already
// cited in the Diagnosis screen's footnote (see ScreenAnalysis.tsx, Sharman
// & Dingle citation). Optional,
// multi-select, purely additional flavor context for the Matcher — never
// required to submit, never treated as diagnostic.
import type { PhysicalSymptomType } from '@/types';

export interface SymptomMeta {
  type: PhysicalSymptomType;
  label: string;
  labelFi: string;
}

// Order is the study's own emphasis, not alphabetical — "head exploding"
// was the most prominent item (the body-map data showed a strong
// forehead-centered area), so it leads.
export const PHYSICAL_SYMPTOMS: SymptomMeta[] = [
  { type: 'head_exploding', label: 'Head exploding', labelFi: 'Pään räjähtäminen' },
  { type: 'muscle_tension', label: 'Muscle tension', labelFi: 'Lihasten jännittyminen' },
  { type: 'heart_pounding', label: 'Heart pounding', labelFi: 'Sydämen hakkaaminen' },
  { type: 'accelerated_breathing', label: 'Accelerated breathing', labelFi: 'Hengityksen kiihtyminen' },
  { type: 'weakness', label: 'Weakness', labelFi: 'Heikotus' },
  { type: 'legs_limp', label: 'Legs going limp', labelFi: 'Jalkojen veltostuminen' },
];

export function getSymptomMeta(type: PhysicalSymptomType): SymptomMeta {
  const meta = PHYSICAL_SYMPTOMS.find((s) => s.type === type);
  if (!meta) throw new Error(`Unknown physical symptom type: ${type}`);
  return meta;
}

// The study's Study 3 embodiment mapping found severe vitutus dominated by
// sympathetic-activation symptoms (head_exploding, muscle_tension,
// heart_pounding, accelerated_breathing); weakness and legs_limp are the
// parasympathetic markers it found rare even during severe episodes.
// Reporting ONLY those two — exact set, nothing else — is the inverse of
// what real severe vitutus looks like. Single source of truth for this
// exact-match check: both the Matcher's cause-only "pseudo-vitutus"
// directive (src/app/api/matcher/route.ts) and the Stage cap it drives
// (getActiveStage(), src/lib/theme.ts) call this, so the two can never
// drift apart.
export function isPseudoVitutusProfile(symptoms: PhysicalSymptomType[]): boolean {
  return symptoms.length === 2 && symptoms.includes('weakness') && symptoms.includes('legs_limp');
}
