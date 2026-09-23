// Bootleg-cassette loading indicator — replaces the generic spin ring on the
// analysis/curating loading screens. Two reels, one "playing" (spokes spin)
// while tape visibly drains from the left reel into the right one. Pure SVG
// + CSS animation, no assets.
//
// Colors are the app's own warm/paper palette (not generic dark-UI grays),
// so the shell reads as a deliberate espresso-toned object against the
// cream page background instead of a flat, hard-to-parse dark box.

import { cn } from '@/lib/utils';

interface CassetteLoaderProps {
  className?: string;
  label?: string;
}

// The hero element of the loading state, not a decorative icon — sized
// accordingly. `aspect-[3/2]` matches the 120x80 viewBox exactly, so width
// alone drives sizing at each breakpoint. Mobile uses a container-relative
// width (not a fixed px value) so it scales up to fill whichever loading
// context it's in — the full-screen analysis loader and the narrower
// prescription-card loader — without a single hardcoded size overflowing
// the tighter one. `max-w-[280px]` is just a ceiling for wide phones.
const SIZE_CLASSES = 'w-4/5 max-w-[280px] aspect-[3/2] sm:w-[140px] sm:max-w-none';

const SHELL = '#2f231f';
const SHELL_BORDER = '#5a4a42';
const WINDOW = '#1c1512';
const WINDOW_BORDER = '#4a3c35';
const REEL_SPOKE = '#a6978c';
const TAPE = '#c98a4b';
const LABEL_BG = '#f5f2e8';
const LABEL_TEXT = '#5a4a42';

function Reel({ cx, cy, spinDelay }: { cx: number; cy: number; spinDelay: string }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle r="15" fill="none" stroke={REEL_SPOKE} strokeWidth="1.5" opacity="0.55" />
      <g className="rite-cassette-spin" style={{ animationDelay: spinDelay, transformBox: 'fill-box', transformOrigin: 'center' }}>
        <line x1="0" y1="-6" x2="0" y2="6" stroke={REEL_SPOKE} strokeWidth="1.5" />
        <line x1="-6" y1="0" x2="6" y2="0" stroke={REEL_SPOKE} strokeWidth="1.5" />
        <line x1="-4.2" y1="-4.2" x2="4.2" y2="4.2" stroke={REEL_SPOKE} strokeWidth="1.5" />
        <line x1="-4.2" y1="4.2" x2="4.2" y2="-4.2" stroke={REEL_SPOKE} strokeWidth="1.5" />
      </g>
      <circle r="3" fill={WINDOW} stroke={REEL_SPOKE} strokeWidth="1" />
    </g>
  );
}

export default function CassetteLoader({ className, label = 'GOREWINTER' }: CassetteLoaderProps) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={cn(SIZE_CLASSES, className)}
      aria-hidden="true"
    >
      {/* Shell */}
      <rect x="2" y="2" width="116" height="76" rx="6" fill={SHELL} stroke={SHELL_BORDER} strokeWidth="1.5" />
      <rect x="10" y="10" width="100" height="40" rx="3" fill={WINDOW} stroke={WINDOW_BORDER} strokeWidth="1" />

      {/* Tape strand between the reels, roughly hugging the bottom of the window */}
      <path d="M 30 30 Q 60 42 90 30" fill="none" stroke={REEL_SPOKE} strokeWidth="1" strokeDasharray="1 2" opacity="0.7" />

      <Reel cx={30} cy={30} spinDelay="0s" />
      <Reel cx={90} cy={30} spinDelay="-0.15s" />

      {/* Tape "wound" fill — drains from the left reel into the right one,
          opposite phase so total tape reads as constant. */}
      <circle cx="30" cy="30" r="10" fill="none" stroke={TAPE} strokeWidth="4" className="rite-cassette-drain-left" opacity="0.8" />
      <circle cx="90" cy="30" r="10" fill="none" stroke={TAPE} strokeWidth="4" className="rite-cassette-drain-right" opacity="0.8" />

      {/* Label — widened from the original "SIDE A" rect to fit the longer
          band name; bold weight so it reads as the release's actual
          identity, not a generic tape-deck caption. */}
      <rect x="22" y="56" width="76" height="14" rx="1.5" fill={LABEL_BG} />
      <text x="60" y="66" textAnchor="middle" fontSize="6.5" fontWeight="700" fontFamily="'Courier New', monospace" fill={LABEL_TEXT} letterSpacing="0.5">
        {label}
      </text>
    </svg>
  );
}
