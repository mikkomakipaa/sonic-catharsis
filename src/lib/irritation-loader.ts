// --- Provoke Me: the irritation-UI stimulus ----------------------------------
// A video "buffering" bar that races to 60%, crawls to 99% and stays
// there, an ETA that never improves, and a "Reload" button that, when
// pressed, costs the patient their progress. All of the
// tunable behaviour lives here as pure functions so it can be tested; the
// timers and DOM live in components/IrritationStimulus.tsx.

// Progress a setback drops the bar to.
export const SETBACK_PERCENT = 62;

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2);

// Percent complete, 0-99, never 100. `setbacks` = how many times the patient
// has been sent back: round 0 is the full run, later rounds restart from
// SETBACK_PERCENT and crawl.
export function progressAt(seconds: number, setbacks = 0): number {
  if (setbacks > 0) {
    // Slow crawl from 62 to 99 over ~25 s.
    return Math.floor(SETBACK_PERCENT + (99 - SETBACK_PERCENT) * easeOut(seconds / 25));
  }
  if (seconds < 3) return Math.floor(60 * easeOut(seconds / 3)); // fast start
  if (seconds < 12) return Math.floor(60 + 30 * easeOut((seconds - 3) / 9)); // 60 -> 90
  return Math.floor(90 + 9 * easeOut((seconds - 12) / 18)); // 90 -> 99, then flat
}

// The ETA is the real irritant: it is confident, and it never gets shorter.
export function etaText(seconds: number, setbacks = 0): string {
  if (setbacks === 0 && seconds < 3) return 'Calculating time remaining…';
  const minutes = Math.min(setbacks + 1, 9);
  return `About ${minutes} minute${minutes === 1 ? '' : 's'} remaining`;
}

// The status line under the bar.
export function statusText(percent: number, setbacks: number): string {
  if (setbacks > 0) return 'Thank you for your patience.';
  if (percent >= 99) return 'Almost there…';
  return 'Buffering…';
}
