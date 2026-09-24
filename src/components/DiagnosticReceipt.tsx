'use client';

import { useEffect, useState } from 'react';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, COMPLETE_ACCENT } from '@/lib/theme';

// The four things the matcher stage actually reasons over (emotion, its
// intensity, physical symptoms, duration — see the Selection screen and
// EmotionData in page.tsx), reworded into the app's deadpan-clinical
// register rather than generic "Analyzing your responses..." copy.
const CHECKLIST = [
  'Reading emotional state',
  'Calibrating severity',
  'Checking physical damage',
  'Measuring festering time',
] as const;

const STEP_INTERVAL_MS = 650;

// The matcher-stage loading state: a minimal animated diagnostic receipt
// that visibly processes what the user just submitted. Deliberately not a
// document/card — no paper box, no border, no shadow. The receipt itself
// *is* the loading object, printing directly onto the page background line
// by line. See docs/design_guidelines.md "Loading States" and the sibling
// PrescriptionCalibration.tsx (curator stage) for the matching treatment.
export default function DiagnosticReceipt() {
  const [checked, setChecked] = useState(0); // how many CHECKLIST items have finished

  useEffect(() => {
    if (checked >= CHECKLIST.length) return;
    const timer = setTimeout(() => setChecked((n) => n + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [checked]);

  const allChecked = checked >= CHECKLIST.length;

  return (
    <div
      className="w-full max-w-[280px] mx-auto"
      style={{ fontFamily: "'Courier New', monospace", color: TEXT_PRIMARY }}
    >
      <div className="text-center mb-3">
        <div className="text-[11px] font-bold uppercase" style={{ letterSpacing: '0.12em' }}>
          Sonic Catharsis
        </div>
        <div className="text-[10px] uppercase mt-0.5" style={{ letterSpacing: '0.08em', color: TEXT_SECONDARY }}>
          Irritation Assessment
        </div>
      </div>

      <div className="border-t border-dashed mb-2" style={{ borderColor: TEXT_TERTIARY }} />

      <div className="flex flex-col gap-1.5 min-h-[92px]">
        {CHECKLIST.map((label, i) => {
          if (i > checked) return null; // not printed yet
          const isDone = i < checked;
          return (
            <div
              key={label}
              className="receipt-line-print flex justify-between items-baseline gap-3 text-[10.5px] uppercase"
              style={{
                letterSpacing: '0.03em',
                animation: 'receipt-line-print 0.25s cubic-bezier(0.25, 1, 0.5, 1) both',
                color: isDone ? COMPLETE_ACCENT : TEXT_SECONDARY,
              }}
            >
              <span>{label}</span>
              <span className={isDone ? undefined : 'receipt-ellipsis-pulse'} style={isDone ? undefined : { animation: 'receipt-ellipsis-pulse 1s ease-in-out infinite' }}>
                {isDone ? '✓' : '…'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-dashed mt-2 mb-3" style={{ borderColor: TEXT_TERTIARY }} />

      <div className="text-center text-[10.5px] uppercase" style={{ letterSpacing: '0.08em', color: TEXT_SECONDARY }}>
        {allChecked ? (
          <span>
            Generating diagnosis
            <span className="receipt-ellipsis-pulse" style={{ animation: 'receipt-ellipsis-pulse 1s ease-in-out infinite' }}>
              &hellip;
            </span>
          </span>
        ) : (
          'Diagnosis pending'
        )}
      </div>
    </div>
  );
}
