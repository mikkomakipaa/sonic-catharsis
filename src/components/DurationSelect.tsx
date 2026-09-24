'use client';

import type { DurationType } from '@/types';
import { DURATION_TIERS } from '@/lib/duration';
import { cn } from '@/lib/utils';
import { EASE } from '@/lib/theme';

interface DurationSelectProps {
  value: DurationType;
  onChange: (value: DurationType) => void;
}

// Single-select ordinal control — NOT the checkbox-grid pattern
// (ClassificationGrid/SymptomChecklist use that for unordered/multi-select
// categories). Duration is ordinal like intensity, so this reads as a row
// of progressive steps rather than a set of independent options: one
// horizontal row of 5 (they divide evenly, unlike the checklist's 6-item
// 2-column grid).
//
// Selected state is deliberately quieter than ClassificationGrid/
// SymptomChecklist's filled-tile treatment — a rounded beige pill here
// read as a distinct button/card among otherwise-bare text labels (there's
// no checkbox glyph or border furniture on the unselected items to soften
// it, unlike the checklist). Instead: a very faint background tint plus a
// thin bottom-border indicator, closer to an active-tab idiom, no
// rounding.
export default function DurationSelect({ value, onChange }: DurationSelectProps) {
  return (
    <div role="radiogroup" aria-label="How long has this been going on?" className="w-full max-w-xl mx-auto">
      <div className="grid grid-cols-5 gap-1.5 max-[480px]:grid-cols-1 max-[480px]:gap-0">
        {DURATION_TIERS.map((d, index) => {
          const isSelected = value === d.type;

          return (
            <button
              key={d.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(d.type)}
              className={cn(
                'flex items-center justify-center text-center px-2 py-2.5 min-h-[44px] cursor-pointer',
                'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c98a4b]/60',
                // Mobile stacks into a single column, reusing the
                // checklist's row-divider convention instead of gaps.
                'max-[480px]:justify-start max-[480px]:gap-2.5 max-[480px]:px-3',
                index > 0 && 'max-[480px]:border-t'
              )}
              style={{
                borderColor: '#e6e2d8',
                borderBottom: isSelected ? '2px solid #c98a4b' : '2px solid transparent',
                background: isSelected ? 'rgba(201,138,75,0.04)' : 'transparent',
                transition: `background 0.2s ${EASE}, border-color 0.2s ${EASE}`,
              }}
            >
              <span
                className="uppercase"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  fontWeight: 500,
                  color: isSelected ? '#2f2e2b' : '#5c584f',
                  transition: `color 0.2s ${EASE}`,
                }}
              >
                {d.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
