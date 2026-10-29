'use client';

import type { Stimulus } from '@/lib/provocations';

// One figure plate from the clinic's (fictional) stimulus atlas: the drawing
// on top, a typewritten caption + A/B/C key below, inside a thin ruled frame
// — the look of a 1950s psychology textbook figure. Captions are rendered
// here in HTML (not baked into the SVG) so they use the app's own
// Special Elite font. Stimuli that haven't been drawn yet get a text-only
// "illustration withheld" panel of the same proportions, so undrawn
// stimuli are still usable and read as deliberate, not broken.

const PAPER = '#f1ece0';
const INK = '#211e1a';
const TYPEWRITER = 'var(--font-special-elite), "Courier New", monospace';

export default function StimulusPlate({ stimulus }: { stimulus: Stimulus }) {
  const caption = `FIG. ${stimulus.fig} — Stimulus: ${stimulus.stimulus}`;

  return (
    <figure
      className="m-0 p-2 rounded-[2px]"
      style={{ background: PAPER, boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}
    >
      <div className="px-3 pt-3 pb-3 max-[480px]:px-2" style={{ border: `1px solid ${INK}` }}>
        {stimulus.image ? (
          // A static, decorative-but-meaningful drawing: alt carries the
          // caption so screen readers get the same information.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stimulus.image} alt={`${caption} ${stimulus.legend}`} className="block w-full h-auto" />
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 text-center"
            style={{
              aspectRatio: '400 / 258',
              color: INK,
              fontFamily: TYPEWRITER,
              backgroundImage: `repeating-linear-gradient(135deg, transparent 0 10px, rgba(33,30,26,0.06) 10px 11px)`,
            }}
            role="img"
            aria-label={`${caption} Illustration withheld.`}
          >
            <span className="uppercase text-[13px] tracking-[0.12em] px-2 py-1" style={{ border: `1px solid ${INK}`, background: PAPER }}>
              Illustration withheld
            </span>
            <span className="text-[11px] opacity-70" style={{ background: PAPER }}>
              Pending ethics review.
            </span>
          </div>
        )}

        <figcaption className="mt-3" style={{ color: INK, fontFamily: TYPEWRITER }}>
          <span className="block text-[12.5px] max-[480px]:text-[12px] leading-snug">{caption}</span>
          <span className="block mt-1 text-[11px] leading-snug opacity-80">{stimulus.legend}</span>
        </figcaption>
      </div>
    </figure>
  );
}
