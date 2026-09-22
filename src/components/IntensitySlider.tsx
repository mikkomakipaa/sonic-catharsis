'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { EASE, STRESS_TIERS, MAX_STRESS_INTENSITY } from '@/lib/theme';

interface IntensitySliderProps {
  value: number | null; // 0-9 normal tier, or MAX_STRESS_INTENSITY for ELEVEN
  onChange: (tier: number) => void;
  onClear: () => void;
  disabled?: boolean;
}

// Intensity, decoupled from the emotion wheel — a discrete horizontal dial
// with 10 visible snap points (tiers 0-9). ELEVEN is deliberately NOT one
// of them: dragging (or holding an arrow key) past the last tick, into the
// quiet space beyond the track, breaks the scale on purpose — same secret
// the wheel used to hide in its outer dashed halo, just relocated here.
const ELEVEN_TIER = MAX_STRESS_INTENSITY;
const NORMAL_MAX_TIER = ELEVEN_TIER - 1; // 9 — last visible tick
const ELEVEN_ZONE_PX = 36; // how far past the track's right edge triggers it
const HANDLE_ELEVEN_OFFSET = 30; // how far past 100% the floating handle sits

// Same ram-horns sigil the wheel's center used to show at ELEVEN.
function HornsSigil({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20 C6.5 15 6 10 9 5 C10.5 3 9.5 2 8 2.5" />
      <path d="M15 20 C17.5 15 18 10 15 5 C13.5 3 14.5 2 16 2.5" />
    </svg>
  );
}

function tierForClientX(clientX: number, rect: DOMRect): number {
  const dx = clientX - rect.left;
  if (dx > rect.width + ELEVEN_ZONE_PX) return ELEVEN_TIER;
  const clamped = Math.min(Math.max(dx, 0), rect.width);
  return Math.round((clamped / rect.width) * NORMAL_MAX_TIER);
}

export default function IntensitySlider({ value, onChange, onClear, disabled = false }: IntensitySliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    onChange(tierForClientX(clientX, rect));
  }, [onChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
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
    if (disabled || value === null) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Holding right past the last normal tick is the keyboard route into
      // the same hidden eleventh position the drag gesture unlocks.
      onChange(value >= NORMAL_MAX_TIER ? ELEVEN_TIER : value + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(value === ELEVEN_TIER ? NORMAL_MAX_TIER : Math.max(0, value - 1));
    }
  };

  const atEleven = value === ELEVEN_TIER;
  const tierInfo = value !== null ? STRESS_TIERS[value] : null;
  const fillPct = value === null ? 0 : atEleven ? 100 : (value / NORMAL_MAX_TIER) * 100;

  return (
    <div className={cn('w-full max-w-[280px] flex flex-col gap-2', disabled && 'opacity-50')}>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.1em', color: '#a6a297' }}>
          Intensity
        </span>
        {disabled || value === null ? (
          <span className="ml-auto text-[10px] uppercase" style={{ letterSpacing: '0.04em', color: '#a6a297' }}>
            Pick an emotion first
          </span>
        ) : (
          <div className="ml-auto flex items-center gap-2.5">
            <span
              className={cn('text-[11px] font-bold uppercase tracking-wide', atEleven && 'rite-eleven-pulse')}
              style={{ letterSpacing: '0.04em', color: tierInfo?.color }}
            >
              {atEleven ? MAX_STRESS_INTENSITY + 1 : value + 1}/{MAX_STRESS_INTENSITY}
            </span>
            <button
              onClick={onClear}
              className="text-[10px] font-medium uppercase tracking-wide transition-colors duration-200"
              style={{ letterSpacing: '0.04em', color: '#a6a297', transition: `color 0.2s ${EASE}` }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#726f66')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#a6a297')}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Extra right padding reserves room for the handle to float past the
          track's own edge when it breaks into the hidden ELEVEN zone. */}
      <div className="relative pr-9" style={{ touchAction: 'none' }}>
        <div
          ref={trackRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label="Intensity"
          aria-valuemin={1}
          aria-valuemax={MAX_STRESS_INTENSITY}
          aria-valuenow={value === null ? undefined : atEleven ? MAX_STRESS_INTENSITY + 1 : value + 1}
          aria-disabled={disabled}
          className={cn('relative h-1.5 rounded-full', !disabled && 'cursor-pointer')}
          style={{ background: '#e6e2d8' }}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        >
          {/* Filled portion up to the current tier */}
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${fillPct}%`,
              background: tierInfo?.color ?? '#c9c4b6',
              transition: dragging ? 'none' : `width 0.15s ${EASE}, background 0.2s ${EASE}`,
            }}
          />

          {/* 10 snap ticks (tiers 0-9) — ELEVEN deliberately has no tick of
              its own, since it isn't part of the printed scale. */}
          {Array.from({ length: MAX_STRESS_INTENSITY }, (_, i) => (
            <div
              key={i}
              className="absolute top-1/2 rounded-full pointer-events-none"
              style={{
                left: `${(i / NORMAL_MAX_TIER) * 100}%`,
                width: i === value ? '9px' : '5px',
                height: i === value ? '9px' : '5px',
                transform: 'translate(-50%, -50%)',
                background: value !== null && i <= value && !atEleven ? '#fff8' : disabled ? '#00000022' : '#00000030',
                transition: `all 0.15s ${EASE}`,
              }}
            />
          ))}

          {/* Handle — sits on the track normally, floats past the right
              edge with a pulsing glow once it crosses into ELEVEN. */}
          {value !== null && (
            <div
              className={cn('absolute top-1/2 rounded-full pointer-events-none', atEleven && 'rite-eleven-pulse')}
              style={{
                left: atEleven ? `calc(100% + ${HANDLE_ELEVEN_OFFSET}px)` : `${fillPct}%`,
                width: '18px',
                height: '18px',
                transform: 'translate(-50%, -50%)',
                background: tierInfo?.color,
                border: atEleven ? '1px solid white' : '2px solid #f7f5f0',
                boxShadow: atEleven ? `0 0 12px 2px ${tierInfo?.color}90` : '0 1px 3px rgba(0,0,0,0.3)',
                transition: dragging ? 'none' : `left 0.15s ${EASE}, background 0.2s ${EASE}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {atEleven && <HornsSigil className="w-3 h-3" style={{ color: 'white' }} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
