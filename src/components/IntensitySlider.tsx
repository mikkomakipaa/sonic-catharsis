'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { EASE, STRESS_TIERS, MAX_STRESS_INTENSITY, TEXT_PRIMARY } from '@/lib/theme';

interface IntensitySliderProps {
  value: number; // 0-9 normal tier, or MAX_STRESS_INTENSITY for ELEVEN
  onChange: (tier: number) => void;
}

// Intensity, decoupled from the classification grid — a discrete horizontal dial
// with 10 visible snap points (tiers 0-9). ELEVEN is deliberately NOT one
// of them: dragging (or holding an arrow key) past the last tick, into the
// quiet space beyond the track, breaks the scale on purpose — same secret
// the wheel used to hide in its outer dashed halo, just relocated here.
//
// This only ever mounts once a category is picked (see StateOfMindPanel's
// progressive disclosure), so there's no "nothing selected yet" state to
// represent here — `value` is always a real tier.
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
  // Vitutusmittari easter egg — undetectable server-side, so this starts
  // false (matching SSR) and only flips after mount if the browser's own
  // locale is Finnish. Nothing else about the control changes.
  const [isFinnish, setIsFinnish] = useState(false);
  useEffect(() => {
    setIsFinnish(navigator.language?.toLowerCase().startsWith('fi') ?? false);
  }, []);

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
      onChange(value >= NORMAL_MAX_TIER ? ELEVEN_TIER : value + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(value === ELEVEN_TIER ? NORMAL_MAX_TIER : Math.max(0, value - 1));
    }
  };

  const atEleven = value === ELEVEN_TIER;
  const tierInfo = STRESS_TIERS[value];
  const fillPct = atEleven ? 100 : (value / NORMAL_MAX_TIER) * 100;

  return (
    // min-w pinned to the same value as max-w — this container sits in a
    // shrink-to-fit flex context (parent uses items-center, not stretch),
    // so width:100%/max-w alone still let content drive the box wider (the
    // track's own w-full doesn't count toward that shrink-to-fit
    // calculation, but the label row's text does) — bumping the readout's
    // font size widened the label row, which widened this whole
    // container, which widened the w-full track along with it. Pinning
    // min-w=max-w forces a true fixed width regardless of label content.
    // Mobile pins the same way, just against 100% instead of a fixed px
    // value — min-w-full alongside max-w-full (not min-w-0) so the same
    // shrink-to-fit problem doesn't reappear at narrow widths: without it,
    // longer tier labels (e.g. "Täysvittuuntuminen") visibly widened the
    // whole control relative to shorter ones (e.g. "1/10").
    <div className="w-full max-w-[280px] min-w-[280px] max-[480px]:max-w-full max-[480px]:min-w-full flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-medium uppercase" style={{ letterSpacing: '0.1em', color: '#5c584f' }}>
          {isFinnish ? 'Vitutusmittari' : 'Intensity'}
        </span>
        {/* Regular text color, not the tier's own (sometimes low-contrast
            light green/yellow) color — the bar/dots/handle below still
            carry the tier color, this label just needs to stay legible. */}
        <span
          className={cn('ml-auto text-[13px] font-medium uppercase', atEleven && 'rite-eleven-pulse')}
          style={{ letterSpacing: '0.04em', color: TEXT_PRIMARY }}
        >
          {isFinnish
            ? tierInfo?.labelFi
            : `${atEleven ? MAX_STRESS_INTENSITY + 1 : value + 1}/${MAX_STRESS_INTENSITY}`}
        </span>
      </div>

      {/* Extra right padding reserves room for the handle to float past the
          track's own edge when it breaks into the hidden ELEVEN zone. */}
      <div className="relative pr-9" style={{ touchAction: 'none' }}>
        {/* Outer wrapper IS the hit target — a generous (44px min on
            mobile) invisible band around the thin visual track, so touch
            precision doesn't depend on hitting a 6px-tall line. The ref
            stays here (not on the visual bar) since both share the same
            width, and pointer math only cares about horizontal position. */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Intensity"
          aria-valuemin={1}
          aria-valuemax={MAX_STRESS_INTENSITY}
          aria-valuenow={atEleven ? MAX_STRESS_INTENSITY + 1 : value + 1}
          className="relative flex items-center select-none max-[480px]:min-h-[44px] cursor-pointer"
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-1.5 rounded-full" style={{ background: '#e6e2d8' }}>
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
                  background: i <= value && !atEleven ? '#fff8' : '#00000030',
                  transition: `all 0.15s ${EASE}`,
                }}
              />
            ))}

            {/* Handle — sits on the track normally, floats past the right
                edge with a pulsing glow once it crosses into ELEVEN. Sized
                up slightly on mobile, with a soft halo (decorative only,
                doesn't affect layout) for easier visual targeting. */}
            <div
              className="absolute top-1/2 rounded-full pointer-events-none hidden max-[480px]:block"
              style={{
                left: atEleven ? `calc(100% + ${HANDLE_ELEVEN_OFFSET}px)` : `${fillPct}%`,
                width: '38px',
                height: '38px',
                transform: 'translate(-50%, -50%)',
                background: `${tierInfo?.color ?? '#c9c4b6'}22`,
                transition: dragging ? 'none' : `left 0.15s ${EASE}, background 0.2s ${EASE}`,
              }}
            />
            <div
              className={cn(
                'absolute top-1/2 rounded-full pointer-events-none w-[18px] h-[18px] max-[480px]:w-5 max-[480px]:h-5',
                atEleven && 'rite-eleven-pulse'
              )}
              style={{
                left: atEleven ? `calc(100% + ${HANDLE_ELEVEN_OFFSET}px)` : `${fillPct}%`,
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
          </div>
        </div>
      </div>
    </div>
  );
}
