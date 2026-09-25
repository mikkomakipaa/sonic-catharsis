'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { EASE, STRESS_TIERS, MAX_STRESS_INTENSITY, TEXT_PRIMARY, TEXT_TERTIARY } from '@/lib/theme';

interface IntensitySliderProps {
  value: number | null; // 0-9 normal tier, MAX_STRESS_INTENSITY for ELEVEN, or null if unset
  onChange: (tier: number) => void;
}

// Intensity, decoupled from the classification grid — a discrete horizontal dial
// with 10 visible snap points (tiers 0-9). ELEVEN is deliberately NOT one
// of them: dragging (or holding an arrow key) past the last tick, into the
// quiet space beyond the track, breaks the scale on purpose — same secret
// the wheel used to hide in its outer dashed halo, just relocated here.
//
// This only ever mounts once a category is picked (see StateOfMindPanel's
// progressive disclosure), but `value` starts as null — nothing is dialed
// in until the user actually clicks/drags/keys the track.
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

export default function IntensitySlider({ value, onChange }: IntensitySliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    onChange(tierForClientX(clientX, rect));
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
      // Holding right past the last normal tick is the keyboard route into
      // the same hidden eleventh position the drag gesture unlocks.
      if (value === null) {
        onChange(0);
      } else {
        onChange(value >= NORMAL_MAX_TIER ? ELEVEN_TIER : value + 1);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (value === null) {
        onChange(0);
      } else {
        onChange(value === ELEVEN_TIER ? NORMAL_MAX_TIER : Math.max(0, value - 1));
      }
    }
  };

  const isSet = value !== null;
  const atEleven = value === ELEVEN_TIER;
  const tierInfo = isSet ? STRESS_TIERS[value] : undefined;
  const fillPct = !isSet ? 0 : atEleven ? 100 : (value / NORMAL_MAX_TIER) * 100;

  return (
    // Plain w-full — the caller (StateOfMindPanel) now wraps this in a
    // definite min(384px, viewport) width, so this component doesn't need
    // its own max-w/mx-auto logic; see the note there for why a definite
    // pixel value (not max-w) is required at that wrapping point.
    <div className="w-full flex flex-col items-center gap-1">
      {/* Same anatomy as DurationSelect's centered current-value word above
          its track — a single centered readout, not a separate axis-name +
          value split row. Regular ink, not the tier's own (sometimes
          low-contrast light) color — the dots/handle below still carry the
          tier color, this readout just needs to stay legible at every tier. */}
      <span
        className={cn('text-[13px] font-medium uppercase', atEleven && 'rite-eleven-pulse')}
        style={{ letterSpacing: '0.04em', color: TEXT_PRIMARY }}
      >
        {!isSet ? '—' : `${atEleven ? MAX_STRESS_INTENSITY + 1 : value + 1}/${MAX_STRESS_INTENSITY}`}
      </span>

      {/* Thin-line/dot track, same visual language as DurationSelect — a
          hairline instead of a filled progress bar, small hollow dots for
          unselected tiers and a larger filled dot (in the tier's own color)
          for the current one. Extra right padding reserves room for the
          marker to float past the track's own edge once it breaks into the
          hidden ELEVEN zone. No top padding (unlike the bottom, which keeps
          room before the endpoint captions) — the 44px-min band below
          already supplies plenty of invisible space above the visible line,
          so stacking more on top just pushed the readout too far away. */}
      <div className="relative w-full pr-9 pb-2" style={{ touchAction: 'none' }}>
        {/* Outer wrapper IS the hit target — a generous 44px-min invisible
            band around the thin visual track, so touch precision doesn't
            depend on hitting a 1px-tall line. Applied at every width, not
            just <=480px: a touch device isn't guaranteed to have a narrow
            viewport (tablets, phones in landscape), and gating this to one
            breakpoint left those devices with almost no vertical hit area
            (the row was only as tall as the 6-9px dots). The ref stays here
            (not on the visual bar) since both share the same width, and
            pointer math only cares about horizontal position. */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Intensity"
          aria-valuemin={1}
          aria-valuemax={MAX_STRESS_INTENSITY}
          aria-valuenow={isSet ? (atEleven ? MAX_STRESS_INTENSITY + 1 : value + 1) : 0}
          aria-valuetext={isSet ? undefined : 'not set'}
          className="relative flex items-center select-none min-h-[44px] cursor-pointer"
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-px" style={{ background: '#e6e2d8' }}>
            {/* 10 snap ticks (tiers 0-9) — ELEVEN deliberately has no tick of
                its own, since it isn't part of the printed scale. Only the
                current tier is filled (with its own ramp color); the rest
                stay hollow, same as DurationSelect's dots. */}
            {Array.from({ length: MAX_STRESS_INTENSITY }, (_, i) => {
              const isSelected = isSet && i === value && !atEleven;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 rounded-full pointer-events-none"
                  style={{
                    left: `${(i / NORMAL_MAX_TIER) * 100}%`,
                    width: isSelected ? '9px' : '6px',
                    height: isSelected ? '9px' : '6px',
                    transform: 'translate(-50%, -50%)',
                    background: isSelected ? STRESS_TIERS[i].color : 'transparent',
                    border: isSelected ? 'none' : '1px solid #cac5b7',
                    transition: `all 0.15s ${EASE}`,
                  }}
                />
              );
            })}

            {/* Soft halo (decorative only, doesn't affect layout) for
                easier visual targeting on mobile — mirrors DurationSelect's
                own halo, tinted with the current tier's color. */}
            {isSet && !atEleven && (
              <div
                className="absolute top-1/2 rounded-full pointer-events-none hidden max-[480px]:block"
                style={{
                  left: `${fillPct}%`,
                  width: '32px',
                  height: '32px',
                  transform: 'translate(-50%, -50%)',
                  background: `${tierInfo?.color}18`,
                  transition: dragging ? 'none' : `left 0.15s ${EASE}`,
                }}
              />
            )}

            {/* ELEVEN marker — floats past the track's right edge with a
                pulsing glow once the scale breaks past its last tick. */}
            {atEleven && (
              <div
                className="absolute top-1/2 rounded-full pointer-events-none w-[18px] h-[18px] max-[480px]:w-5 max-[480px]:h-5 rite-eleven-pulse"
                style={{
                  left: `calc(100% + ${HANDLE_ELEVEN_OFFSET}px)`,
                  transform: 'translate(-50%, -50%)',
                  background: tierInfo?.color,
                  border: '1px solid white',
                  boxShadow: `0 0 12px 2px ${tierInfo?.color}90`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HornsSigil className="w-3 h-3" style={{ color: 'white' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Endpoint captions — same anatomy/style as DurationSelect's FRESH /
          LIFESTYLE row below its track, so the two controls read as sibling
          scales rather than unrelated widgets. Uses the actual top of the
          10-tick scale (STRESS_TIERS[NORMAL_MAX_TIER], "Multi-climax" — see
          the ordering note in theme.ts), so the caption stays truthful to
          where 10/10 and the hidden ELEVEN zone actually sit. */}
      <div className="flex items-start justify-between gap-2 w-full pr-9 text-[9px] uppercase" style={{ letterSpacing: '0.06em', color: TEXT_TERTIARY }}>
        {/* Each caption gets its own half-width, wrapping onto a second
            line rather than colliding with the other — "Intolerable
            Lightness" / "Multi-climax" are longer than Duration's
            Fresh/Lifestyle pair and don't fit on one line at this width. */}
        <span className="max-w-[48%] text-left">{STRESS_TIERS[0].label}</span>
        <span className="max-w-[48%] text-right">{STRESS_TIERS[NORMAL_MAX_TIER].label}</span>
      </div>
    </div>
  );
}
