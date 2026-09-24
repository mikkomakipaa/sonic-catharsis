'use client';

import { useEffect, useState } from 'react';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, COMPLETE_ACCENT } from '@/lib/theme';

// The four axes of "sonic treatment" the curator stage is nominally dialing
// in. Deliberately not wired to any real per-genre value (see below) — this
// is theatrical calibration, not a progress bar.
const COMPOUNDS = ['Aggression', 'Heaviness', 'Dissonance', 'Melody'] as const;

const SEGMENTS = 8;
const LOCK_INTERVAL_MS = 650; // cadence a row locks at — matches DiagnosticReceipt's own step timing
const SCAN_TICK_MS = 120; // how often a still-scanning row's bar flickers

function randomFillCount(): number {
  // Never 0 or SEGMENTS — a scanner that's fully empty or fully full reads
  // as a real measurement, not motion. Anywhere in between reads as noise.
  return 1 + Math.floor(Math.random() * (SEGMENTS - 1));
}

// One row's bar: ▰-segments that flicker while scanning, then freeze full
// with a ✓ once locked. The flicker pattern is intentionally random and
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
      className="receipt-line-print flex justify-between items-baseline gap-3 text-[10.5px] uppercase"
      style={{
        letterSpacing: '0.03em',
        animation: 'receipt-line-print 0.25s cubic-bezier(0.25, 1, 0.5, 1) both',
        color: locked ? COMPLETE_ACCENT : TEXT_SECONDARY,
      }}
    >
      <span className="shrink-0">{label}</span>
      <span className="tabular-nums" style={{ letterSpacing: '0.05em' }}>
        {'▰'.repeat(filled)}
        {'▱'.repeat(SEGMENTS - filled)}
      </span>
      <span className="shrink-0 w-3 text-right">{locked ? '✓' : ''}</span>
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
      className="w-full max-w-[280px] mx-auto"
      style={{ fontFamily: "'Courier New', monospace", color: TEXT_PRIMARY }}
    >
      <div className="text-center mb-3">
        <div className="text-[11px] font-bold uppercase" style={{ letterSpacing: '0.12em' }}>
          Sonic Catharsis
        </div>
        <div className="text-[10px] uppercase mt-0.5" style={{ letterSpacing: '0.08em', color: TEXT_SECONDARY }}>
          Dose Calibration
        </div>
      </div>

      <div className="border-t border-dashed mb-2" style={{ borderColor: TEXT_TERTIARY }} />

      <div className="flex flex-col gap-1.5 min-h-[92px]">
        {COMPOUNDS.map((label, i) => (i > locked ? null : <CompoundRow key={label} label={label} locked={i < locked} />))}
      </div>

      <div className="border-t border-dashed mt-2 mb-3" style={{ borderColor: TEXT_TERTIARY }} />

      <div className="text-center text-[10.5px] uppercase" style={{ letterSpacing: '0.08em', color: TEXT_SECONDARY }}>
        {allLocked ? (
          <span>
            Preparing prescription
            <span className="receipt-ellipsis-pulse" style={{ animation: 'receipt-ellipsis-pulse 1s ease-in-out infinite' }}>
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
