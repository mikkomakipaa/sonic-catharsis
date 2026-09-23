'use client';

import { useState } from 'react';
import { TriggerType, TriggerSelection } from '@/types';
import { TRIGGER_TYPES } from '@/lib/trigger';
import { cn } from '@/lib/utils';
import { EASE } from '@/lib/theme';

interface ClassificationGridProps {
  onSelectionChange: (selection: TriggerSelection | null) => void;
  selection: TriggerSelection | null;
  disabled?: boolean;
}

// A pseudo-clinical intake checklist, not a wheel or field: 9 cells (the 8
// frustration categories + "Unclassified") laid out as a plain 3x3 grid,
// each a thin-line checkbox + label. Visually a form someone filled out in
// a hurry, not another emotion selector — see lib/trigger.ts. Single
// selection only, despite the checkbox glyph (role="radiogroup"/"radio" —
// the checkbox look is a tone choice, the behavior is still one-of-many).
const DEFAULT_TIER = 5;

function selectionFor(type: TriggerType, tier: number): TriggerSelection {
  return { trigger: type, intensity: tier };
}

// Custom thin-line check — never the OS checkbox glyph.
function CheckMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
    </svg>
  );
}

export default function ClassificationGrid({ onSelectionChange, selection, disabled = false }: ClassificationGridProps) {
  const [hoveredType, setHoveredType] = useState<TriggerType | null>(null);

  const selectType = (type: TriggerType) => {
    if (disabled) return;
    // Switching category keeps whatever intensity was already dialed in —
    // only a brand-new selection falls back to the default.
    const tier = selection?.intensity ?? DEFAULT_TIER;
    onSelectionChange(selectionFor(type, tier));
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: TriggerType) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectType(type);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="What kind of bullshit was it?"
      className={cn('w-full max-w-xl mx-auto', disabled && 'opacity-50')}
    >
      <div className="grid grid-cols-3 max-[480px]:grid-cols-2">
        {TRIGGER_TYPES.map((c, index) => {
          const isSelected = selection?.trigger === c.type;
          const isHovered = hoveredType === c.type;
          // Row-divider borders have to be computed per breakpoint since the
          // grid itself reflows from 3 columns (desktop) to 2 (mobile) —
          // a border-t class based on a single column count would land on
          // the wrong cells at the other breakpoint. `border-t` (no prefix)
          // covers indices that need a divider at BOTH breakpoints; the
          // `max-[480px]:border-t` case below covers indices that only
          // start a new row once the grid narrows to 2 columns.
          const desktopRow = Math.floor(index / 3);
          const mobileRow = Math.floor(index / 2);
          const needsBorder = desktopRow > 0;
          const needsMobileOnlyBorder = !needsBorder && mobileRow > 0;

          return (
            <button
              key={c.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${c.label} — ${c.description}`}
              title={c.description}
              disabled={disabled}
              onClick={() => selectType(c.type)}
              onKeyDown={(e) => handleKeyDown(e, c.type)}
              onMouseEnter={() => setHoveredType(c.type)}
              onMouseLeave={() => setHoveredType(null)}
              onFocus={() => setHoveredType(c.type)}
              onBlur={() => setHoveredType(null)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-4 max-[480px]:px-2 text-left min-h-[44px]',
                'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c98a4b]/60',
                !disabled && 'cursor-pointer',
                disabled && 'cursor-not-allowed',
                needsBorder && 'border-t',
                needsMobileOnlyBorder && 'max-[480px]:border-t'
              )}
              style={{
                borderColor: '#e6e2d8',
                background: isHovered && !isSelected ? 'rgba(201,138,75,0.05)' : 'transparent',
                transition: `background 0.2s ${EASE}`,
              }}
            >
              {/* Thin-line checkbox — never the OS glyph */}
              <span
                className="relative flex items-center justify-center shrink-0 rounded-[3px]"
                style={{
                  width: '15px',
                  height: '15px',
                  border: `1.4px solid ${isSelected ? '#2f2e2b' : '#a6a297'}`,
                  background: isSelected ? '#2f2e2b' : 'transparent',
                  transition: `background 0.2s ${EASE}, border-color 0.2s ${EASE}`,
                }}
              >
                {isSelected && <CheckMark className="w-3 h-3" style={{ color: '#f7f5f0' }} />}
              </span>

              <span
                className="uppercase whitespace-nowrap max-[480px]:whitespace-normal"
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#2f2e2b' : isHovered ? '#3f3b33' : '#5c584f',
                  transition: `color 0.2s ${EASE}, font-weight 0.2s ${EASE}`,
                }}
              >
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
