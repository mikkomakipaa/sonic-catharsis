'use client';

import { useState, useRef, useEffect } from 'react';
import { Dices } from 'lucide-react';
import { EmotionType, EmotionWheelSelection } from '@/types';
import { cn } from '@/lib/utils';
import { EASE, MAX_STRESS_INTENSITY } from '@/lib/theme';

interface EmotionWheelProps {
  onSelectionChange: (selection: EmotionWheelSelection | null) => void;
  selection: EmotionWheelSelection | null;
  disabled?: boolean;
}

// No wheel, no disc, no radial layout — an open field the 8 emotions sit in
// as loose, hand-placed points (percentages of the field's own width/height,
// not angle+radius). Component name kept for import stability; it's no
// longer a "wheel" in any visual sense. `weight` gives each node a slightly
// different visual prominence (size/halo strength) so the field reads as
// organic rather than eight identical buttons.
const EMOTIONS: { type: EmotionType; color: string; description: string; x: number; y: number; weight: number }[] = [
  { type: 'joy', color: '#eab308', description: 'Joy', x: 14, y: 20, weight: 0.95 },
  { type: 'trust', color: '#22c55e', description: 'Trust', x: 82, y: 18, weight: 1.05 },
  { type: 'fear', color: '#166534', description: 'Fear', x: 8, y: 68, weight: 0.9 },
  { type: 'surprise', color: '#06b6d4', description: 'Surprise', x: 58, y: 90, weight: 1.0 },
  { type: 'sadness', color: '#3b82f6', description: 'Sadness', x: 30, y: 84, weight: 1.08 },
  { type: 'disgust', color: '#8b5cf6', description: 'Disgust', x: 70, y: 85, weight: 0.92 },
  { type: 'anger', color: '#ef4444', description: 'Anger', x: 46, y: 10, weight: 1.1 },
  { type: 'anticipation', color: '#f97316', description: 'Anticipation', x: 92, y: 55, weight: 0.97 },
];

// The one thing that still anchors the composition — everything else
// floats loosely around it, off-axis, not orbiting it.
const CENTER = { x: 50, y: 46 };

// Base positions are pulled slightly toward the center (uniform scale, not
// per-node) so the outermost nodes feel connected to the composition rather
// than scattered at the field's edges. Asymmetry itself is untouched.
const FIELD_INWARD_SCALE = 0.9;

// 4 permanent, subtle links — a few compositionally useful relationships,
// not a graph. Each pair also brightens slightly when either endpoint is
// hovered, focused, or selected.
const FIELD_LINKS: [number, number][] = [
  [0, 1], // joy - trust
  [1, 7], // trust - anticipation
  [4, 5], // sadness - disgust
  [2, 4], // fear - sadness
];

// Fixed "dust" points across the field — hand-placed, not random-per-render.
const FIELD_DUST = [
  { x: 40, y: 38, size: 1.5, opacity: 0.3 },
  { x: 62, y: 60, size: 1, opacity: 0.22 },
  { x: 22, y: 45, size: 1, opacity: 0.2 },
  { x: 78, y: 40, size: 1.5, opacity: 0.25 },
  { x: 48, y: 72, size: 1, opacity: 0.18 },
];

// Selected node pulls a fixed number of px toward the center anchor,
// strengthening the tie without turning the composition into a wheel spoke.
const SELECTED_INWARD_PULL = 24;
// A newly-picked emotion with no prior intensity starts here — the same
// mid-scale default the old keyboard fallback used.
const DEFAULT_TIER = 5;

function basePosition(index: number) {
  const e = EMOTIONS[index];
  return {
    x: CENTER.x + (e.x - CENTER.x) * FIELD_INWARD_SCALE,
    y: CENTER.y + (e.y - CENTER.y) * FIELD_INWARD_SCALE,
  };
}

function selectionForIndex(index: number, tier: number): EmotionWheelSelection {
  const e = EMOTIONS[index];
  const base = basePosition(index);
  return { emotion: e.type, stressLevel: tier, position: base };
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

export default function EmotionWheel({ onSelectionChange, selection, disabled = false }: EmotionWheelProps) {
  const [hoveredEmotion, setHoveredEmotion] = useState<EmotionType | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [fieldSize, setFieldSize] = useState({ width: 560, height: 280 });
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const node = fieldRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const width = box?.inlineSize ?? entry.contentRect.width;
      const height = box?.blockSize ?? entry.contentRect.height;
      if (width > 0 && height > 0) setFieldSize({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const selectEmotion = (index: number) => {
    if (disabled) return;
    // Switching emotion keeps whatever intensity was already dialed in on
    // the slider — only a brand-new selection falls back to the default.
    const tier = selection?.stressLevel ?? DEFAULT_TIER;
    onSelectionChange(selectionForIndex(index, tier));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectEmotion(index);
    }
  };

  // "I don't know how I feel" — picks a random emotion at a random
  // intensity, weighted toward the high end (sqrt of a uniform draw skews
  // the distribution upward) since nobody rolls the dice when they're fine.
  const rollDice = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    const index = Math.floor(Math.random() * EMOTIONS.length);
    const tier = Math.min(MAX_STRESS_INTENSITY - 1, Math.floor(Math.sqrt(Math.random()) * MAX_STRESS_INTENSITY));
    onSelectionChange(selectionForIndex(index, tier));
  };

  const px = (pct: number, axis: 'x' | 'y') => (pct / 100) * (axis === 'x' ? fieldSize.width : fieldSize.height);
  const centerPx = { x: px(CENTER.x, 'x'), y: px(CENTER.y, 'y') };
  const selectedEmotionMeta = selection ? EMOTIONS.find((e) => e.type === selection.emotion) ?? null : null;
  const [rollDiceHover, setRollDiceHover] = useState(false);

  return (
    <div
      ref={fieldRef}
      className={cn(
        "relative w-full max-w-xl mx-auto h-[260px] sm:h-[320px]",
        disabled && "opacity-50"
      )}
    >
      {/* Atmospheric detail only — no container edge, no silhouette. Just
          faint grain and fixed dust points; the center anchor carries its
          own small wash further down. */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '160px 160px',
        }}
      />

      {/* Fixed dust points */}
      {FIELD_DUST.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            transform: 'translate(-50%, -50%)',
            background: '#f5f2e8',
            opacity: d.opacity,
          }}
        />
      ))}

      {/* Permanent, subtle links — brighten near a hovered/focused/selected
          endpoint instead of staying flat. */}
      {isMounted && FIELD_LINKS.map(([a, b], i) => {
        const pa = basePosition(a);
        const pb = basePosition(b);
        const paPx = { x: px(pa.x, 'x'), y: px(pa.y, 'y') };
        const pbPx = { x: px(pb.x, 'x'), y: px(pb.y, 'y') };
        const dx = pbPx.x - paPx.x;
        const dy = pbPx.y - paPx.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const activeType = hoveredEmotion ?? selection?.emotion ?? null;
        const isActive = activeType === EMOTIONS[a].type || activeType === EMOTIONS[b].type;
        return (
          <div
            key={i}
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${length}px`,
              height: '1px',
              background: isActive
                ? 'linear-gradient(90deg, rgba(198,155,110,0.28), rgba(198,155,110,0.08))'
                : 'linear-gradient(90deg, rgba(198,155,110,0.12), rgba(198,155,110,0.03))',
              transform: `translate(${paPx.x}px, ${paPx.y}px) rotate(${angle}deg)`,
              transformOrigin: '0 0',
              transition: `background 0.25s ${EASE}`,
            }}
          />
        );
      })}

      {/* Tether from the center anchor to the selected emotion only */}
      {isMounted && selection && (() => {
        const index = EMOTIONS.findIndex((e) => e.type === selection.emotion);
        if (index === -1) return null;
        const base = basePosition(index);
        const p = { x: px(base.x, 'x'), y: px(base.y, 'y') };
        const dx = p.x - centerPx.x;
        const dy = p.y - centerPx.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const length = Math.max(dist - SELECTED_INWARD_PULL, 0);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const color = EMOTIONS[index].color;
        return (
          <div
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${length}px`,
              height: '1px',
              background: `linear-gradient(90deg, ${color}05, ${color}45)`,
              transform: `translate(${centerPx.x}px, ${centerPx.y}px) rotate(${angle}deg)`,
              transformOrigin: '0 0',
              transition: `width 0.3s ${EASE}, background 0.3s ${EASE}`,
            }}
          />
        );
      })()}

      {/* Center anchor — text only, no disc, no button chrome. A soft,
          small wash sits behind it instead of a hard edge. Also the ninth,
          genuinely selectable state: "I don't know how I feel". */}
      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{ left: `${CENTER.x}%`, top: `${CENTER.y}%`, transform: 'translate(-50%, -50%)' }}
      >
        <div
          className="absolute rite-constellation-breathe pointer-events-none"
          style={{
            width: '110px',
            height: '80px',
            left: '50%',
            top: '50%',
            transform: 'translate(-54%, -48%)',
            background: selectedEmotionMeta
              ? `radial-gradient(ellipse, ${selectedEmotionMeta.color}1a 0%, transparent 72%)`
              : 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 72%)',
            filter: 'blur(16px)',
          }}
        />
        {selection && selectedEmotionMeta ? (
          <div className="relative flex flex-col items-center gap-1.5">
            <span
              className="text-sm font-bold uppercase tracking-wide"
              style={{ letterSpacing: '0.08em', color: '#2f2e2b' }}
            >
              {selectedEmotionMeta.description}
            </span>
            <span
              className="block"
              style={{ width: '22px', height: '2px', background: selectedEmotionMeta.color, opacity: 0.8 }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={rollDice}
            disabled={disabled}
            aria-label="I don't know how I feel — pick randomly"
            className="relative flex flex-col items-center gap-1 transition-colors duration-200"
            style={{ color: rollDiceHover ? '#3f3d38' : '#575550' }}
            onMouseEnter={() => setRollDiceHover(true)}
            onMouseLeave={() => setRollDiceHover(false)}
            onFocus={() => setRollDiceHover(true)}
            onBlur={() => setRollDiceHover(false)}
          >
            <Dices className="w-5 h-5" />
            <span className="text-[10px] text-center font-semibold uppercase tracking-wide leading-tight" style={{ letterSpacing: '0.07em' }}>
              I don&apos;t know
              <br />
              how I feel
            </span>
          </button>
        )}
      </div>

      {/* Emotion nodes — loose, hand-placed points, each with a permanently
          visible name label underneath so the custom sigils never have to
          be deciphered on their own. Sigil = identity, label = clarity. */}
      {isMounted && EMOTIONS.map((emotion, index) => {
        const isSelected = selection?.emotion === emotion.type;
        const isHovered = hoveredEmotion === emotion.type;
        const base = basePosition(index);

        let left = base.x;
        let top = base.y;
        if (isSelected && fieldSize.width > 0) {
          const p = { x: px(base.x, 'x'), y: px(base.y, 'y') };
          const dx = centerPx.x - p.x;
          const dy = centerPx.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const pullX = (dx / dist) * SELECTED_INWARD_PULL;
          const pullY = (dy / dist) * SELECTED_INWARD_PULL;
          left = ((p.x + pullX) / fieldSize.width) * 100;
          top = ((p.y + pullY) / fieldSize.height) * 100;
        }

        // Hit area stays within the 44-52px accessible range regardless of
        // the visible circle, which is drawn ~12-15% smaller inside it.
        const hitSize = isSelected ? 52 : 46;
        const visualSize = Math.round((isSelected ? 46 : 38) * emotion.weight);
        const scale = isSelected ? 1 : isHovered ? 1.07 : 1;

        // Emotion names are functional interaction labels, not decorative
        // metadata — TEXT_SECONDARY at rest, not the pale TEXT_DECORATIVE
        // tone reserved for connector lines/dust.
        const labelColor = isSelected ? '#2f2e2b' : isHovered ? '#3f3b33' : '#5c584f';

        return (
          <div
            key={emotion.type}
            className="absolute flex flex-col items-center gap-1.5 z-20"
            style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
          >
            <button
              type="button"
              aria-label={`${emotion.description}${isSelected ? ' (selected)' : ''}`}
              disabled={disabled}
              className={cn(
                "relative rounded-full flex items-center justify-center transform-gpu",
                "focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/70 focus-visible:outline-offset-2",
                !disabled && "cursor-pointer",
                disabled && "cursor-not-allowed"
              )}
              style={{
                width: `${hitSize}px`,
                height: `${hitSize}px`,
                transform: `scale(${scale})`,
                transition: `transform 0.2s ${EASE}`,
              }}
              onClick={() => selectEmotion(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onMouseEnter={() => setHoveredEmotion(emotion.type)}
              onMouseLeave={() => setHoveredEmotion(null)}
              onFocus={() => setHoveredEmotion(emotion.type)}
              onBlur={() => setHoveredEmotion(null)}
            >
              {/* Visual circle — smaller than the hit area on purpose. */}
              <span
                className="absolute rounded-full flex items-center justify-center"
                style={{
                  width: `${visualSize}px`,
                  height: `${visualSize}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: isSelected ? emotion.color : `${emotion.color}16`,
                  color: isSelected ? '#0a0a0a' : isHovered ? emotion.color : `${emotion.color}d0`,
                  filter: isSelected ? 'saturate(0.72)' : undefined,
                  boxShadow: isSelected
                    ? `0 0 7px 1px ${emotion.color}35, 0 2px 6px rgba(0,0,0,0.22)`
                    : isHovered
                    ? `0 0 12px 5px ${emotion.color}30`
                    : `0 0 6px 2px ${emotion.color}${Math.round(emotion.weight * 20).toString(16).padStart(2, '0')}`,
                  border: isSelected ? `1px solid ${emotion.color}` : `1px solid ${emotion.color}${isHovered ? '55' : '2a'}`,
                  transition: `background 0.25s ${EASE}, box-shadow 0.25s ${EASE}, color 0.2s ${EASE}, border-color 0.25s ${EASE}`,
                }}
              >
                <EmotionGlyph type={emotion.type} className={isSelected ? 'w-6 h-6' : 'w-5 h-5'} />
              </span>
            </button>

            {/* Permanent label — small, muted neutral gray, never the
                emotion color, so it reads as clarity rather than another
                decorative element. */}
            <span
              className="pointer-events-none select-none text-center font-semibold uppercase whitespace-nowrap"
              style={{
                fontSize: '10.5px',
                letterSpacing: '0.06em',
                color: labelColor,
                transition: `color 0.2s ${EASE}`,
              }}
            >
              {emotion.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}
