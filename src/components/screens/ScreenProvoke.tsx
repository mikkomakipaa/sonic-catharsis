'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Stimulus } from '@/lib/provocations';
import StimulusPlate from '@/components/StimulusPlate';
import {
  EASE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  DIVIDER_COLOR,
  TREATMENT_ACCENT_BG,
  TREATMENT_ACCENT_BG_HOVER,
  TREATMENT_ACCENT_BORDER,
  TREATMENT_ACCENT_TEXT,
} from '@/lib/theme';

interface ScreenProvokeProps {
  // This session's stimuli, already picked (see pickStimuli()). Shown one
  // at a time; running out of them discharges the patient.
  stimuli: Stimulus[];
  // "Nyt vituttaa?" → yes: the parent re-opens intake pre-filled from it.
  onConfirm: (stimulus: Stimulus) => void;
  // Last resort once every stimulus has been declined: hand the patient to
  // a human (Seppo, the vittuilubotti — see ScreenVittuilu).
  onEscalate: () => void;
  onBack: () => void;
  onReset: () => void;
}

const EYEBROW_STYLE = {
  fontFamily: 'var(--font-special-elite), monospace',
  letterSpacing: '0.04em',
  color: TEXT_TERTIARY,
} as const;

const SECONDARY_BUTTON_STYLE = {
  letterSpacing: '0.05em',
  color: TEXT_SECONDARY,
  background: '#f2efe7',
  border: '1px solid #e6e2d8',
  transition: `all 0.2s ${EASE}`,
} as const;

export default function ScreenProvoke({ stimuli, onConfirm, onEscalate, onBack, onReset }: ScreenProvokeProps) {
  const [index, setIndex] = useState(0);
  const discharged = index >= stimuli.length;
  const stimulus = stimuli[index];

  return (
    <div className="flex flex-col max-w-2xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      {discharged || !stimulus ? (
        <div className="flex flex-col">
          <span className="uppercase text-[11px] max-[640px]:text-[10.5px]" style={EYEBROW_STYLE}>
            Discharge Note
          </span>
          <p
            className="m-0 mt-4 text-[17px] max-[640px]:text-[16px] leading-[1.45] font-semibold"
            style={{ color: TEXT_PRIMARY, fontFamily: 'var(--font-plex-sans), Arial, sans-serif' }}
          >
            Patient remained unresponsive to {stimuli.length} consecutive stimuli.
          </p>
          <p
            className="m-0 mt-2 text-[15px] max-[640px]:text-[16px] leading-[1.45]"
            style={{ color: TEXT_SECONDARY, fontFamily: 'var(--font-plex-sans), Arial, sans-serif' }}
          >
            Assessment: constitutionally unbothered. No further treatment indicated. Please leave the premises calmly, as you
            evidently are able to.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-5" style={{ borderTop: `1px solid ${DIVIDER_COLOR}` }}>
            <button
              onClick={onEscalate}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-sm active:scale-[0.98]"
              style={{
                letterSpacing: '0.05em',
                color: TREATMENT_ACCENT_TEXT,
                background: TREATMENT_ACCENT_BG,
                border: `1px solid ${TREATMENT_ACCENT_BORDER}`,
                transition: `all 0.2s ${EASE}`,
              }}
            >
              Escalate to a human
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-sm active:scale-[0.98]"
              style={SECONDARY_BUTTON_STYLE}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Epicrisis
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-sm active:scale-[0.98]"
              style={SECONDARY_BUTTON_STYLE}
            >
              New Intake
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <span className="uppercase text-[11px] max-[640px]:text-[10.5px]" style={EYEBROW_STYLE}>
            Provocation Protocol / Stimulus {index + 1} of {stimuli.length}
          </span>

          {/* key= restarts the reveal animation for each new plate */}
          <div key={stimulus.id} className="mt-5 max-[640px]:mt-4 animate-[rite-reveal_0.4s_cubic-bezier(0.25,1,0.5,1)_both]">
            <StimulusPlate stimulus={stimulus} />
          </div>

          <div className="mt-7 max-[640px]:mt-5 text-center">
            <p className="m-0 text-[22px] font-bold" style={{ color: TEXT_PRIMARY }} lang="fi">
              Nyt vituttaa?
            </p>
            <p className="m-0 mt-1 text-[13px]" style={{ color: TEXT_SECONDARY }}>
              Observe the plate. Report any change in condition.
            </p>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              onClick={() => onConfirm(stimulus)}
              className="w-full max-w-[280px] py-3.5 font-semibold text-sm uppercase rounded-lg active:scale-[0.98]"
              style={{
                transition: `all 0.2s ${EASE}`,
                letterSpacing: '0.08em',
                background: TREATMENT_ACCENT_BG,
                color: TREATMENT_ACCENT_TEXT,
                border: `1px solid ${TREATMENT_ACCENT_BORDER}`,
                boxShadow: `0 2px 6px -2px ${TREATMENT_ACCENT_BORDER}40`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = TREATMENT_ACCENT_BG_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = TREATMENT_ACCENT_BG)}
            >
              Yes. Re-assess me
            </button>
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="w-full max-w-[280px] py-2.5 text-xs font-medium uppercase rounded-lg active:scale-[0.98]"
              style={SECONDARY_BUTTON_STYLE}
            >
              {index + 1 < stimuli.length ? 'No. Next stimulus' : 'No. Still nothing'}
            </button>
          </div>

          <div className="flex items-center justify-center mt-6">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide"
              style={{ letterSpacing: '0.05em', color: TEXT_SECONDARY }}
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Epicrisis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
