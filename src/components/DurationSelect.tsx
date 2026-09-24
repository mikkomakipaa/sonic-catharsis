'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DurationType } from '@/types';
import { DURATION_TIERS } from '@/lib/duration';
import { EASE, TEXT_TERTIARY } from '@/lib/theme';

interface DurationSelectProps {
  value: DurationType;
  onChange: (value: DurationType) => void;
}

const LAST_INDEX = DURATION_TIERS.length - 1; // 4
const DURATION_ACCENT = '#c98a4b';

function indexForClientX(clientX: number, rect: DOMRect): number {
  const dx = clientX - rect.left;
  const clamped = Math.min(Math.max(dx, 0), rect.width);
  return Math.round((clamped / rect.width) * LAST_INDEX);
}

// Five discrete stops, not the continuous-feeling drag of IntensitySlider —
// duration is a coarser, secondary axis (see lib/duration.ts), so this reads
// as a much quieter stepped scale: a thin line, small dots, no filled
// progress bar, no color-coded tiers. Mirrors the intensity slider's
// interaction model (click/drag/arrow keys on a track) without duplicating
// its prominent presentation — see StateOfMindPanel for how the two sit
// next to each other. Replaces the earlier 5-button grid, which ran ~450px
// tall stacked on mobile; this is a single row at any width.
export default function DurationSelect({ value, onChange }: DurationSelectProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const index = DURATION_TIERS.findIndex((d) => d.type === value);
  const current = DURATION_TIERS[index];

  const updateFromPointer = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    onChange(DURATION_TIERS[indexForClientX(clientX, rect)].type);
  }, [onChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    updateFromPointer(e.clientX);
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => updateFromPointer(e.clientX);
    const handleUp = () => setDragging(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging, updateFromPointer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(DURATION_TIERS[Math.min(index + 1, LAST_INDEX)].type);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(DURATION_TIERS[Math.max(index - 1, 0)].type);
    }
  };

  const fillPct = (index / LAST_INDEX) * 100;

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-1.5">
      {/* Current tier's word — the one thing that visibly changes as the
          user drags/steps, deliberately smaller and quieter than
          IntensitySlider's readout. */}
      <span
        className="uppercase transition-colors"
        style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', color: DURATION_ACCENT, transition: `color 0.15s ${EASE}` }}
      >
        {current?.label}
      </span>

      <div className="relative w-full py-2" style={{ touchAction: 'none' }}>
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="How long has it been festering?"
          aria-valuemin={1}
          aria-valuemax={DURATION_TIERS.length}
          aria-valuenow={index + 1}
          aria-valuetext={current?.label}
          className="relative flex items-center select-none min-h-[24px] cursor-pointer"
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-px" style={{ background: '#e6e2d8' }}>
            {DURATION_TIERS.map((d, i) => {
              const isSelected = i === index;
              return (
                <div
                  key={d.type}
                  className="absolute top-1/2 rounded-full pointer-events-none"
                  style={{
                    left: `${(i / LAST_INDEX) * 100}%`,
                    width: isSelected ? '9px' : '6px',
                    height: isSelected ? '9px' : '6px',
                    transform: 'translate(-50%, -50%)',
                    background: isSelected ? DURATION_ACCENT : 'transparent',
                    border: isSelected ? 'none' : '1px solid #cac5b7',
                    transition: `all 0.15s ${EASE}`,
                  }}
                />
              );
            })}

            <div
              className="absolute top-1/2 rounded-full pointer-events-none hidden max-[480px]:block"
              style={{
                left: `${fillPct}%`,
                width: '32px',
                height: '32px',
                transform: 'translate(-50%, -50%)',
                background: `${DURATION_ACCENT}18`,
                transition: dragging ? 'none' : `left 0.15s ${EASE}`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full text-[9px] uppercase" style={{ letterSpacing: '0.06em', color: TEXT_TERTIARY }}>
        <span>{DURATION_TIERS[0].label}</span>
        <span>{DURATION_TIERS[LAST_INDEX].label}</span>
      </div>
    </div>
  );
}
