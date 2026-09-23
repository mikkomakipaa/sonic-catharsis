'use client';

import { cn } from '@/lib/utils';
import { SURFACE, STAGES, EASE } from '@/lib/theme';

interface DescentRailProps {
  activeIndex: number; // 0 = surface, 1-9 = stage depth
}

const BANDS = [SURFACE, ...STAGES];

// Horizontal progress rail, shared by the analysis and descent screens —
// replaces the old vertical DescentShaft sidebar. A thin baseline connector
// with evenly spaced ticks; dots keep a fixed physical size and only ever
// scale via `transform` (not width/height) so the baseline stays pixel-
// aligned across every stage regardless of active/inactive state. All 10
// bands always fit the container width (no horizontal scroll) so every
// mobile viewport shows the full I-IX progression at once.
export default function DescentRail({ activeIndex }: DescentRailProps) {
  return (
    <div className="w-full">
      <div className="relative w-full min-w-0" style={{ borderTop: '1px solid #e6e2d8' }}>
        <div className="flex justify-between -mt-[3px]">
          {BANDS.map((band, i) => {
            const isActive = i === activeIndex;
            const isPast = i < activeIndex;

            return (
              <div
                key={band.name}
                className="flex-1 flex flex-col items-center min-w-0 px-0.5"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full transition-all duration-500 max-[480px]:w-2 max-[480px]:h-2"
                  style={{
                    background: isActive ? band.color : isPast ? 'rgba(111,143,124,0.55)' : '#e6e2d8',
                    boxShadow: isActive ? `0 0 0 3px ${band.color}26` : 'none',
                    transform: isActive ? 'scale(1.8)' : 'scale(1)',
                    transitionTimingFunction: EASE,
                  }}
                />
                {/* Font sizes as Tailwind classes (not inline) so the
                    max-[480px] mobile variant can bump them up without a
                    separate JS breakpoint check. All 10 bands must fit the
                    viewport without horizontal scroll, so the mobile bump
                    stays modest — see DescentRail history for the overflow
                    this used to cause on narrow screens. */}
                <span
                  className={cn(
                    'font-mono mt-2 transition-all duration-300 max-[480px]:text-[11px]',
                    isActive ? 'text-[13px] max-[480px]:text-[12px] font-bold' : 'text-[11px] font-normal'
                  )}
                  style={{ color: isActive ? band.color : isPast ? '#726f66' : '#7d7869' }}
                >
                  {band.roman}
                </span>
                {/* Only the active stage spells out its name on desktop —
                    on mobile the StageHeader directly above already shows
                    the same name at large size, so repeating it here would
                    be pure duplication; every other stage stays numeral-only
                    either way so the rail reads as a progression at a
                    glance instead of a wall of colliding labels. */}
                {isActive && (
                  <span
                    className="text-[9px] uppercase tracking-wide mt-0.5 whitespace-nowrap max-[480px]:hidden"
                    style={{ color: '#2b2a26', fontWeight: 700, letterSpacing: '0.05em' }}
                  >
                    {band.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
