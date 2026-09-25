'use client';

import { useEffect, useState } from 'react';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, COMPLETE_ACCENT, EASE } from '@/lib/theme';

// The four axes of "sonic treatment" the curator stage is nominally dialing
// in. Deliberately not wired to any real per-genre value (see below) — this
// is theatrical calibration, not a progress bar.
const COMPOUNDS = ['Aggression', 'Heaviness', 'Dissonance', 'Melody'] as const;

const SEGMENTS = 8;
// Four 400ms locks fit the shared 2.2-second minimum, leaving a 600ms final
// beat for the prescription footer before the result replaces the document.
const LOCK_INTERVAL_MS = 400;
const SCAN_TICK_MS = 120; // how often a still-scanning row's bar flickers

function randomFillCount(): number {
  // Never 0 or SEGMENTS — a scanner that's fully empty or fully full reads
  // as a real measurement, not motion. Anywhere in between reads as noise.
  return 1 + Math.floor(Math.random() * (SEGMENTS - 1));
}

// One row's bar: ▰-segments that flicker while scanning, then freeze full
// once locked. The flicker pattern is intentionally random and
// re-randomized every tick — it must never settle on a value that looks
// like a measurement, since it isn't one. See docs/design_guidelines.md
// "Loading States" for why this whole component exists as document
// typography with no card wrapper.
function CompoundRow({ label, locked }: { label: string; locked: boolean }) {
  const [fillCount, setFillCount] = useState(randomFillCount);

  useEffect(() => {
    if (locked) return;
    const timer = setInterval(() => setFillCount(randomFillCount()), SCAN_TICK_MS);
    return () => clearInterval(timer);
  }, [locked]);

  const filled = locked ? SEGMENTS : fillCount;

  return (
    <div
      className="receipt-line-print grid grid-cols-[104px_minmax(0,1fr)] items-baseline gap-3 text-[12px] max-[480px]:text-[14px] font-medium uppercase"
      style={{
        letterSpacing: '0.03em',
        animation: `receipt-line-print 0.3s ${EASE} both`,
        color: locked ? COMPLETE_ACCENT : TEXT_SECONDARY,
      }}
    >
      <span>{label}</span>
      <span className="justify-self-end tabular-nums" style={{ letterSpacing: '0.05em' }}>
        {'▰'.repeat(filled)}
        {'▱'.repeat(SEGMENTS - filled)}
      </span>
    </div>
  );
}

// The curator-stage loading state: a companion piece to DiagnosticReceipt
// (matcher stage), same document typography and "no card wrapper" rule, but
// framed as dosage calibration rather than assessment — this stage is
// literally selecting the sonic treatment, not reading the complaint.
export default function PrescriptionCalibration() {
  const [locked, setLocked] = useState(0); // how many COMPOUNDS rows have locked

  useEffect(() => {
    if (locked >= COMPOUNDS.length) return;
    const timer = setTimeout(() => setLocked((n) => n + 1), LOCK_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [locked]);

  const allLocked = locked >= COMPOUNDS.length;

  return (
    <div
      className="w-full max-w-[320px] mx-auto"
      style={{ fontFamily: "'Courier New', monospace", color: TEXT_PRIMARY }}
    >
      <div className="text-center mb-3 text-[11px] max-[480px]:text-[13px] font-medium uppercase" style={{ letterSpacing: '0.08em', color: TEXT_PRIMARY }}>
        Dose Calibration
      </div>

      <div className="border-t border-dashed mb-2" style={{ borderColor: TEXT_TERTIARY }} />

      <div className="flex flex-col gap-2 min-h-[108px]">
        {COMPOUNDS.map((label, i) => (i > locked ? null : <CompoundRow key={label} label={label} locked={i < locked} />))}
      </div>

      <div className="border-t border-dashed mt-2 mb-3" style={{ borderColor: TEXT_TERTIARY }} />

      <div className="text-center text-[12px] max-[480px]:text-[13px] font-medium uppercase" style={{ letterSpacing: '0.08em', color: TEXT_PRIMARY }}>
        {allLocked ? (
          <span>
            Preparing prescription
            <span className="receipt-ellipsis-pulse" style={{ animation: `receipt-ellipsis-pulse 1s ${EASE} infinite` }}>
              &hellip;
            </span>
          </span>
        ) : (
          'Formulating active compounds'
        )}
      </div>
    </div>
  );
}
