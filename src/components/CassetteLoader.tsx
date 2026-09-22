// Bootleg-cassette loading indicator — replaces the generic spin ring on the
// analysis/curating loading screens. Two reels, one "playing" (spokes spin)
// while tape visibly drains from the left reel into the right one. Pure SVG
// + CSS animation, no assets.

interface CassetteLoaderProps {
  className?: string;
}

function Reel({ cx, cy, spinDelay }: { cx: number; cy: number; spinDelay: string }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle r="15" fill="none" stroke="#52525b" strokeWidth="1.5" />
      <g className="rite-cassette-spin" style={{ animationDelay: spinDelay, transformBox: 'fill-box', transformOrigin: 'center' }}>
        <line x1="0" y1="-6" x2="0" y2="6" stroke="#71717a" strokeWidth="1.5" />
        <line x1="-6" y1="0" x2="6" y2="0" stroke="#71717a" strokeWidth="1.5" />
        <line x1="-4.2" y1="-4.2" x2="4.2" y2="4.2" stroke="#71717a" strokeWidth="1.5" />
        <line x1="-4.2" y1="4.2" x2="4.2" y2="-4.2" stroke="#71717a" strokeWidth="1.5" />
      </g>
      <circle r="3" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
    </g>
  );
}

export default function CassetteLoader({ className }: CassetteLoaderProps) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      style={{ width: '64px', height: '43px' }}
      aria-hidden="true"
    >
      {/* Shell */}
      <rect x="2" y="2" width="116" height="76" rx="6" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
      <rect x="10" y="10" width="100" height="40" rx="3" fill="#09090b" stroke="#27272a" strokeWidth="1" />

      {/* Tape strand between the reels, roughly hugging the bottom of the window */}
      <path d="M 30 30 Q 60 42 90 30" fill="none" stroke="#52525b" strokeWidth="1" strokeDasharray="1 2" />

      <Reel cx={30} cy={30} spinDelay="0s" />
      <Reel cx={90} cy={30} spinDelay="-0.15s" />

      {/* Tape "wound" fill — drains from the left reel into the right one,
          opposite phase so total tape reads as constant. */}
      <circle cx="30" cy="30" r="10" fill="none" stroke="#dc2626" strokeWidth="4" className="rite-cassette-drain-left" opacity="0.5" />
      <circle cx="90" cy="30" r="10" fill="none" stroke="#dc2626" strokeWidth="4" className="rite-cassette-drain-right" opacity="0.5" />

      {/* Label */}
      <rect x="30" y="56" width="60" height="14" rx="1.5" fill="#27272a" />
      <text x="60" y="66" textAnchor="middle" fontSize="7" fontFamily="'Courier New', monospace" fill="#71717a" letterSpacing="1">
        SIDE A
      </text>
    </svg>
  );
}
