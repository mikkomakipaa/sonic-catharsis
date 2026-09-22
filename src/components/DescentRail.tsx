'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SURFACE, CIRCLES, EASE } from '@/lib/theme';

interface DescentRailProps {
  activeIndex: number; // 0 = surface, 1-9 = circle depth
}

const BANDS = [SURFACE, ...CIRCLES];

// Horizontal progress rail, shared by the analysis and descent screens —
// replaces the old vertical DescentShaft sidebar. A thin baseline connector
// with evenly spaced ticks; dots keep a fixed physical size and only ever
// scale via `transform` (not width/height) so the baseline stays pixel-
// aligned across every stage regardless of active/inactive state.
export default function DescentRail({ activeIndex }: DescentRailProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIndex]);

  return (
    <div className="w-full">
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="relative border-t border-white/10 min-w-max sm:min-w-0">
          <div className="flex justify-between -mt-[3px]">
            {BANDS.map((band, i) => {
              const isActive = i === activeIndex;
              const isPast = i < activeIndex;

              return (
                <div
                  key={band.name}
                  ref={isActive ? activeRef : undefined}
                  className="flex-1 flex flex-col items-center px-2 min-w-[40px]"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      background: isActive ? band.color : isPast ? 'rgba(161,161,170,0.35)' : 'rgba(255,255,255,0.08)',
                      boxShadow: isActive ? `0 0 10px 1px ${band.color}, 0 0 3px ${band.color}` : 'none',
                      transform: isActive ? 'scale(1.8)' : 'scale(1)',
                      transitionTimingFunction: EASE,
                    }}
                  />
                  <span
                    className="font-mono mt-2 transition-all duration-300"
                    style={{
                      fontSize: isActive ? '13px' : '11px',
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? band.color : isPast ? '#71717a' : '#3f3f46',
                      textShadow: isActive ? `0 0 14px ${band.color}90` : 'none',
                    }}
                  >
                    {band.roman}
                  </span>
                  <span
                    className={cn('text-[9px] uppercase tracking-wide mt-0.5 whitespace-nowrap', !isActive && 'hidden sm:block')}
                    style={{
                      color: isActive ? 'white' : isPast ? '#52525b' : '#27272a',
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {band.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
