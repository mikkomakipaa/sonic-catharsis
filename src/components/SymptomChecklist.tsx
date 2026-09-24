'use client';

import { useState } from 'react';
import type { PhysicalSymptomType } from '@/types';
import { PHYSICAL_SYMPTOMS } from '@/lib/symptoms';
import { cn } from '@/lib/utils';
import { EASE } from '@/lib/theme';

interface SymptomChecklistProps {
  selected: PhysicalSymptomType[];
  onSelectedChange: (selected: PhysicalSymptomType[]) => void;
}

// Same thin-line-checkbox intake-form language as ClassificationGrid, but
// multi-select (role="group" of real checkboxes, not a radiogroup) — any
// number of symptoms can be reported at once, unlike the single-select
// trigger grid. Fixed 2-column layout at every width (6 items, 3 rows)
// rather than ClassificationGrid's 3-to-2 responsive reflow, since there's
// no 3-column case here.
function CheckMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
    </svg>
  );
}

export default function SymptomChecklist({ selected, onSelectedChange }: SymptomChecklistProps) {
  const [hoveredType, setHoveredType] = useState<PhysicalSymptomType | null>(null);

  const toggle = (type: PhysicalSymptomType) => {
    onSelectedChange(
      selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: PhysicalSymptomType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle(type);
    }
  };

  return (
    <div role="group" aria-label="Any physical symptoms?" className="w-full max-w-xl mx-auto">
      <div className="grid grid-cols-2">
        {PHYSICAL_SYMPTOMS.map((s, index) => {
          const isSelected = selected.includes(s.type);
          const isHovered = hoveredType === s.type;
          const needsBorder = Math.floor(index / 2) > 0;

          return (
            <button
              key={s.type}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              title={s.labelFi}
              onClick={() => toggle(s.type)}
              onKeyDown={(e) => handleKeyDown(e, s.type)}
              onMouseEnter={() => setHoveredType(s.type)}
              onMouseLeave={() => setHoveredType(null)}
              onFocus={() => setHoveredType(s.type)}
              onBlur={() => setHoveredType(null)}
              className={cn(
                // Denser than ClassificationGrid on purpose — this is
                // secondary/optional context (10% of the stage formula),
                // not the primary classification, so it shouldn't occupy
                // comparable visual weight. min-h-[44px] stays mobile-only
                // (touch target); desktop rows genuinely shrink with the
                // reduced py.
                'flex items-center gap-2.5 px-3 py-1.5 max-[480px]:px-2 max-[640px]:py-3 max-[480px]:min-h-[44px] text-left cursor-pointer',
                'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c98a4b]/60',
                needsBorder && 'border-t'
              )}
              style={{
                borderColor: '#e6e2d8',
                background: isSelected ? 'rgba(201,138,75,0.08)' : isHovered ? 'rgba(201,138,75,0.05)' : 'transparent',
                transition: `background 0.2s ${EASE}`,
              }}
            >
              <span
                className="relative flex items-center justify-center shrink-0 rounded-[3px] max-[640px]:!h-8 max-[640px]:!w-8"
                style={{
                  width: '15px',
                  height: '15px',
                  border: `1.4px solid ${isSelected ? '#2f2e2b' : '#a6a297'}`,
                  background: isSelected ? '#2f2e2b' : 'transparent',
                  transition: `background 0.2s ${EASE}, border-color 0.2s ${EASE}`,
                }}
              >
                {isSelected && <CheckMark className="w-3 h-3 max-[640px]:!h-5 max-[640px]:!w-5" style={{ color: '#f7f5f0' }} />}
              </span>

              <span
                className="uppercase max-[480px]:whitespace-normal max-[640px]:!text-[17px]"
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                  color: isSelected ? '#2f2e2b' : isHovered ? '#3f3b33' : '#5c584f',
                  transition: `color 0.2s ${EASE}`,
                }}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
