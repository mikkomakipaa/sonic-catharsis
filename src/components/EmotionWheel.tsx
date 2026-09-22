'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dices } from 'lucide-react';
import { EmotionType, EmotionWheelSelection } from '@/types';
import { cn } from '@/lib/utils';
import { EASE, STRESS_TIERS, MAX_STRESS_INTENSITY, TOTAL_INTENSITY_LEVELS } from '@/lib/theme';

interface EmotionWheelProps {
  onSelectionChange: (selection: EmotionWheelSelection | null) => void;
  selection: EmotionWheelSelection | null;
  disabled?: boolean;
}

// Plutchik's 8 basic emotions, in wheel order — index i and i+4 are always
// the opposing pair (joy<->sadness, trust<->disgust, fear<->anger,
// surprise<->anticipation), so opposites land directly across the circle.
const EMOTIONS: { type: EmotionType; color: string; description: string }[] = [
  { type: 'joy', color: '#eab308', description: 'Joy' },
  { type: 'trust', color: '#22c55e', description: 'Trust' },
  { type: 'fear', color: '#166534', description: 'Fear' },
  { type: 'surprise', color: '#06b6d4', description: 'Surprise' },
  { type: 'sadness', color: '#3b82f6', description: 'Sadness' },
  { type: 'disgust', color: '#8b5cf6', description: 'Disgust' },
  { type: 'anger', color: '#ef4444', description: 'Anger' },
  { type: 'anticipation', color: '#f97316', description: 'Anticipation' },
];

// Radii below are calibrated against the wheel's base (unscaled) footprint,
// BASE_WHEEL_SIZE. The wheel itself shrinks on narrow viewports (see the
// responsive width classes below), so every consumer of these constants
// must scale by the wheel's actual-rendered-size / BASE_WHEEL_SIZE ratio —
// otherwise touch distance on a shrunk mobile wheel would desync from the
// intensity tiers computed against the full-size numbers.
const BASE_WHEEL_SIZE = 320;
const MIN_RADIUS = 27;
const MAX_RADIUS = 160;
const GLYPH_RADIUS = 120;
// Tier 10 ("ELEVEN") is deliberately not part of the visible 0-9 band — you
// have to drag past the wheel's own edge to reach it, so it reads as
// breaking the scale rather than just being the next ring in line.
const ELEVEN_TIER = MAX_STRESS_INTENSITY;
const NORMAL_MAX_TIER = ELEVEN_TIER - 1;
const ELEVEN_RADIUS = MAX_RADIUS + 45;

function radiusForTier(tier: number, scale = 1): number {
  const base = tier >= ELEVEN_TIER ? ELEVEN_RADIUS : MIN_RADIUS + (tier / NORMAL_MAX_TIER) * (MAX_RADIUS - MIN_RADIUS);
  return base * scale;
}

function tierForDistance(distance: number, scale = 1): number {
  const min = MIN_RADIUS * scale;
  const max = MAX_RADIUS * scale;
  if (distance > max) return ELEVEN_TIER;
  const clamped = Math.min(Math.max(distance, min), max);
  return Math.round(((clamped - min) / (max - min)) * NORMAL_MAX_TIER);
}

function selectionForIndexAndTier(index: number, tier: number): EmotionWheelSelection {
  const angle = (index * 360) / EMOTIONS.length;
  const radian = (angle * Math.PI) / 180;
  const radius = radiusForTier(tier);
  const x = Math.round(Math.cos(radian) * radius * 100) / 100;
  const y = Math.round(Math.sin(radian) * radius * 100) / 100;
  return { emotion: EMOTIONS[index].type, stressLevel: tier, position: { x, y } };
}

// Minimal geometric sigils, one per emotion — 24x24 viewBox, stroke-based.
function EmotionGlyph({ type, className }: { type: EmotionType; className?: string }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'joy':
      return <svg {...common}><path d="M6 9 Q12 15 18 9" /></svg>;
    case 'trust':
      return <svg {...common}><circle cx="9" cy="12" r="5" /><circle cx="15" cy="12" r="5" /></svg>;
    case 'fear':
      return <svg {...common}><path d="M4 12 L8 6 L12 15 L16 6 L20 12" /></svg>;
    case 'surprise':
      return <svg {...common}><ellipse cx="12" cy="13" rx="3" ry="4.5" /><path d="M12 3 V6" /></svg>;
    case 'sadness':
      return <svg {...common}><path d="M6 15 Q12 9 18 15" /></svg>;
    case 'disgust':
      return <svg {...common}><path d="M5 14 Q8 17 11 14 T17 14" /></svg>;
    case 'anger':
      return <svg {...common}><path d="M5 8 L11 12 M19 8 L13 12 M8 17 H16" /></svg>;
    case 'anticipation':
      return <svg {...common}><path d="M6 14 L12 6 L18 14 M12 6 V18" /></svg>;
  }
}

// ELEVEN's own sigil — curled ram-horns, same stroke language as the
// emotion glyphs, standing in for the "\m/" gesture without an emoji.
function HornsSigil({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20 C6.5 15 6 10 9 5 C10.5 3 9.5 2 8 2.5" />
      <path d="M15 20 C17.5 15 18 10 15 5 C13.5 3 14.5 2 16 2.5" />
    </svg>
  );
}

export default function EmotionWheel({ onSelectionChange, selection, disabled = false }: EmotionWheelProps) {
  const [hoveredEmotion, setHoveredEmotion] = useState<EmotionType | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragTier, setDragTier] = useState<number | null>(null);
  // Ratio of the wheel's actual rendered size to BASE_WHEEL_SIZE — stays 1
  // at the desktop/tablet size and shrinks on narrow mobile viewports (see
  // the responsive width classes below). Selection positions are always
  // stored in base (unscaled) units and multiplied by this at render time,
  // so drag math and glyph placement stay in sync at any wheel size.
  const [wheelScale, setWheelScale] = useState(1);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const node = wheelRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      if (width > 0) setWheelScale(width / BASE_WHEEL_SIZE);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const updateFromPointer = useCallback((clientX: number, clientY: number, index: number) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scale = rect.width / BASE_WHEEL_SIZE;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const tier = tierForDistance(distance, scale);
    const snappedRadius = radiusForTier(tier); // stored in base units

    const angle = (index * 360) / EMOTIONS.length;
    const radian = (angle * Math.PI) / 180;
    const x = Math.round(Math.cos(radian) * snappedRadius * 100) / 100;
    const y = Math.round(Math.sin(radian) * snappedRadius * 100) / 100;

    setDragTier(tier);
    onSelectionChange({ emotion: EMOTIONS[index].type, stressLevel: tier, position: { x, y } });
  }, [onSelectionChange]);

  useEffect(() => {
    if (dragIndex === null) return;

    const handleMove = (e: PointerEvent) => updateFromPointer(e.clientX, e.clientY, dragIndex);
    const handleUp = () => {
      setDragIndex(null);
      setDragTier(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragIndex, updateFromPointer]);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (disabled) return;
    e.stopPropagation();
    updateFromPointer(e.clientX, e.clientY, index);
    setDragIndex(index);
  };

  // Keyboard fallback: Enter/Space picks the emotion at the default mid
  // tier; once selected, Up/Down steps the intensity tier by one.
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    const isSelected = selection?.emotion === EMOTIONS[index].type;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const tier = isSelected ? selection.stressLevel : 5;
      onSelectionChange(selectionForIndexAndTier(index, tier));
    } else if (isSelected && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const delta = e.key === 'ArrowUp' ? 1 : -1;
      const tier = Math.min(MAX_STRESS_INTENSITY, Math.max(0, selection.stressLevel + delta));
      onSelectionChange(selectionForIndexAndTier(index, tier));
    }
  };

  const clearSelection = () => {
    if (!disabled) {
      onSelectionChange(null);
    }
  };

  // "I don't know how I feel" — picks a random emotion at a random
  // intensity, weighted toward the high end (sqrt of a uniform draw skews
  // the distribution upward) since nobody rolls the dice when they're fine.
  const rollDice = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    const index = Math.floor(Math.random() * EMOTIONS.length);
    const tier = Math.min(MAX_STRESS_INTENSITY, Math.floor(Math.sqrt(Math.random()) * (MAX_STRESS_INTENSITY + 1)));
    onSelectionChange(selectionForIndexAndTier(index, tier));
  };

  const activeTier = dragTier ?? selection?.stressLevel ?? null;
  const activeTierInfo = activeTier !== null ? STRESS_TIERS[activeTier] : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={wheelRef}
        className={cn(
          // Desktop diameter trimmed ~9% (320px -> 292px) for better vertical
          // balance; the wheelScale ResizeObserver below keeps every radius,
          // ring, and glyph position proportional automatically.
          "relative w-64 h-64 sm:w-[292px] sm:h-[292px] rounded-full border",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
        style={{
          // Deep charcoal/espresso instead of the old obsidian-red — dark
          // and rich enough to stay the page's hero instrument, but warm
          // rather than a black/red metal treatment.
          background: 'radial-gradient(circle at 30% 30%, #3a2a26 0%, #241a17 55%, #16110f 100%)',
          boxShadow:
            activeTier === ELEVEN_TIER
              ? `0 0 0 1px ${STRESS_TIERS[ELEVEN_TIER].color}, 0 0 16px 3px ${STRESS_TIERS[ELEVEN_TIER].color}40, 0 4px 12px rgba(0,0,0,0.4)`
              : '0 0 0 0.5px rgba(90,74,62,0.4), 0 4px 12px rgba(0,0,0,0.35)',
          borderColor: activeTier === ELEVEN_TIER ? STRESS_TIERS[ELEVEN_TIER].color : 'rgba(90,74,62,0.5)',
          borderWidth: '1px',
          touchAction: 'none',
          transition: `border-color 0.3s ${EASE}, box-shadow 0.3s ${EASE}`,
        }}
      >
        {/* Intensity rings for the normal 0-9 band — tinted low(green)->
            high(dark red) so radial position always carries a visible
            meaning, not just an invisible drag distance. */}
        {STRESS_TIERS.slice(0, ELEVEN_TIER).map((tier, i) => {
          const r = radiusForTier(i, wheelScale);
          const isActiveRing = activeTier === i;
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
              style={{
                width: `${r * 2}px`,
                height: `${r * 2}px`,
                transform: 'translate(-50%, -50%)',
                border: `1px solid ${tier.color}${isActiveRing ? '60' : '30'}`,
                transition: `border-color 0.2s ${EASE}`,
              }}
            />
          );
        })}

        {/* ELEVEN — lives outside the wheel's own edge, not another ring in
            the sequence. A faint dashed halo hints it exists at rest; once
            active it pulses hard so hitting the scale-break is unmistakable. */}
        <div
          className={cn('absolute top-1/2 left-1/2 rounded-full pointer-events-none', activeTier === ELEVEN_TIER && 'rite-eleven-pulse')}
          style={{
            width: `${ELEVEN_RADIUS * 2 * wheelScale}px`,
            height: `${ELEVEN_RADIUS * 2 * wheelScale}px`,
            transform: 'translate(-50%, -50%)',
            border: `${activeTier === ELEVEN_TIER ? 2 : 1}px dashed ${STRESS_TIERS[ELEVEN_TIER].color}${activeTier === ELEVEN_TIER ? 'aa' : '2a'}`,
            color: STRESS_TIERS[ELEVEN_TIER].color,
            boxShadow: activeTier === ELEVEN_TIER ? `0 0 18px 3px ${STRESS_TIERS[ELEVEN_TIER].color}50` : 'none',
            transition: `border-color 0.2s ${EASE}, box-shadow 0.2s ${EASE}`,
          }}
        />

        {/* Center marker — recessed into the wheel, shows emotion + live
            intensity-tier label so the selected value is never invisible. */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div
            className={cn('w-20 h-20 rounded-full flex flex-col items-center justify-center px-1.5', activeTier === ELEVEN_TIER && 'rite-eleven-pulse')}
            style={{
              background: 'radial-gradient(circle at 50% 40%, rgba(9,9,11,1) 0%, rgba(24,24,27,0.9) 100%)',
              boxShadow:
                activeTier === ELEVEN_TIER
                  ? `inset 0 2px 6px rgba(0,0,0,0.7), inset 0 0 0 1px ${STRESS_TIERS[ELEVEN_TIER].color}, 0 0 14px 2px ${STRESS_TIERS[ELEVEN_TIER].color}55`
                  : selection
                  ? `inset 0 2px 6px rgba(0,0,0,0.7), inset 0 0 0 0.5px rgba(255,255,255,0.06), 0 0 8px var(--rite-accent, rgba(239,68,68,0.2))`
                  : 'inset 0 2px 6px rgba(0,0,0,0.7), inset 0 0 0 0.5px rgba(255,255,255,0.04)',
            }}
          >
            {activeTier === ELEVEN_TIER && activeTierInfo ? (
              <HornsSigil className="w-9 h-9 rite-eleven-pulse" style={{ color: activeTierInfo.color }} />
            ) : selection && activeTierInfo ? (
              <span className="text-xs text-center font-bold uppercase tracking-wide text-zinc-200" style={{ letterSpacing: '0.05em' }}>
                {EMOTIONS.find((e) => e.type === selection.emotion)?.description}
              </span>
            ) : (
              <button
                type="button"
                onClick={rollDice}
                disabled={disabled}
                aria-label="I don't know how I feel — pick randomly"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-full w-full h-full transition-colors duration-200',
                  !disabled && 'hover:text-zinc-300 cursor-pointer'
                )}
                style={{ color: '#71717a' }}
              >
                <Dices className="w-5 h-5" />
                <span className="text-[8px] text-center font-medium uppercase tracking-wide leading-tight" style={{ letterSpacing: '0.06em' }}>
                  I don&apos;t
                  <br />
                  know
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Emotion sigils — the selected one IS the draggable intensity
            marker (it relocates to the live drag/tier position instead of
            a separate duplicate marker sliding on top of it). Unselected
            emotions stay parked at the fixed glyph ring. */}
        {isMounted && EMOTIONS.map((emotion, index) => {
          const angle = (index * 360) / EMOTIONS.length;
          const radian = (angle * Math.PI) / 180;
          const restX = Math.round(Math.cos(radian) * GLYPH_RADIUS * wheelScale * 100) / 100;
          const restY = Math.round(Math.sin(radian) * GLYPH_RADIUS * wheelScale * 100) / 100;

          const isSelected = selection?.emotion === emotion.type;
          const isHovered = hoveredEmotion === emotion.type;
          const atEleven = isSelected && selection?.stressLevel === ELEVEN_TIER;
          // selection.position is stored in base (unscaled) units — scale to
          // the wheel's current rendered size here.
          const x = isSelected && selection ? selection.position.x * wheelScale : restX;
          const y = isSelected && selection ? selection.position.y * wheelScale : restY;

          return (
            <button
              key={emotion.type}
              type="button"
              aria-label={`${emotion.description}${isSelected && activeTier !== null ? `, intensity ${activeTier === ELEVEN_TIER ? TOTAL_INTENSITY_LEVELS : activeTier + 1} of ${TOTAL_INTENSITY_LEVELS}` : ''}`}
              disabled={disabled}
              className={cn(
                "absolute w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transform-gpu z-20",
                "focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60 focus-visible:outline-offset-2",
                isSelected ? "scale-110" : "hover:scale-[1.08] active:scale-105 transition-transform duration-200",
                atEleven && "rite-eleven-pulse",
                disabled && "cursor-not-allowed hover:scale-100"
              )}
              style={{
                background: atEleven ? STRESS_TIERS[ELEVEN_TIER].color : isSelected || isHovered ? emotion.color : 'rgba(148,141,127,0.18)',
                color: isSelected || isHovered ? '#0a0a0a' : emotion.color,
                filter: isSelected && !atEleven ? 'saturate(0.72)' : undefined,
                boxShadow: atEleven
                  ? `0 0 12px 2px ${STRESS_TIERS[ELEVEN_TIER].color}90`
                  : isSelected
                  ? `0 0 6px ${emotion.color}38, 0 2px 5px rgba(0,0,0,0.22)`
                  : isHovered
                  ? `0 0 5px ${emotion.color}30, 0 2px 4px rgba(0,0,0,0.18)`
                  : 'inset 0 1px 3px rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.03)',
                border: atEleven ? '1px solid white' : isSelected ? `1px solid ${emotion.color}` : 'none',
                left: `calc(50% + ${x}px - 24px)`,
                top: `calc(50% + ${y}px - 24px)`,
                transition: isSelected
                  ? `left 0.15s ${EASE}, top 0.15s ${EASE}, background 0.2s ${EASE}, box-shadow 0.2s ${EASE}, border-color 0.2s ${EASE}`
                  : `background 0.2s ${EASE}, box-shadow 0.2s ${EASE}, border-color 0.2s ${EASE}`,
                touchAction: 'none',
              }}
              onPointerDown={(e) => handlePointerDown(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onMouseEnter={() => setHoveredEmotion(emotion.type)}
              onMouseLeave={() => setHoveredEmotion(null)}
            >
              <EmotionGlyph type={emotion.type} className="w-5 h-5" />

              {isHovered && !disabled && (
                <div
                  className="absolute whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-150"
                  style={{
                    background: 'rgba(0,0,0,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${emotion.color}40`,
                    borderRadius: '2px',
                    padding: '6px 10px',
                    boxShadow: `0 4px 12px rgba(0,0,0,0.4), 0 0 8px ${emotion.color}20`,
                    zIndex: 30,
                    left: '50%',
                    bottom: 'calc(100% + 10px)',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="text-xs font-medium text-white tracking-wide">
                    {emotion.description.toUpperCase()}
                  </div>
                  <div
                    className="absolute top-full left-1/2 transform -translate-x-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: `4px solid ${emotion.color}40`,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}

      </div>

      {/* Compact, secondary status line — the wheel + center hub already
          carry the selection, this is just a quiet confirmation, not a
          second status block competing with it. */}
      {activeTierInfo && (
        <div className="flex items-center gap-2.5">
          <p
            className={cn(
              'text-center uppercase tracking-wide',
              activeTier === ELEVEN_TIER ? 'text-sm font-extrabold rite-eleven-pulse' : 'text-[11px] font-medium'
            )}
            style={{ letterSpacing: '0.04em', color: '#a6a297' }}
          >
            Intensity:{' '}
            <span style={{ color: activeTierInfo.color, fontWeight: 700 }}>
              {activeTier === ELEVEN_TIER ? TOTAL_INTENSITY_LEVELS : (activeTier ?? 0) + 1}/{TOTAL_INTENSITY_LEVELS}
            </span>
          </p>

          {selection && !disabled && (
            <button
              onClick={clearSelection}
              className="text-[10px] font-medium uppercase tracking-wide transition-colors duration-200"
              style={{ letterSpacing: '0.04em', color: '#a6a297', transition: `color 0.2s ${EASE}` }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#726f66')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#a6a297')}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {!selection && !disabled && (
        <p className="text-[11px] text-center" style={{ color: '#a6a297' }}>Click and drag an emotion — distance from center sets intensity</p>
      )}
    </div>
  );
}
