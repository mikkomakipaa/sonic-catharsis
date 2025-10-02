'use client';

import { useState, useRef, useEffect } from 'react';
import { EmotionType, EmotionWheelSelection } from '@/types';
import { cn } from '@/lib/utils';

interface EmotionWheelProps {
  title: string;
  onSelectionChange: (selection: EmotionWheelSelection | null) => void;
  selection: EmotionWheelSelection | null;
  disabled?: boolean;
  playfulMode?: boolean;
}

// 12-emotion set organized by quadrants
const EMOTIONS: { type: EmotionType; color: string; colorPlayful: string; emoji: string; description: string; quadrant: 'happy' | 'sad' | 'angry' | 'calm' }[] = [
  // Happy quadrant (Green → Vibrant rainbow pastels)
  { type: 'happy', color: '#22c55e', colorPlayful: '#fbbf24', emoji: '😊', description: 'Happy', quadrant: 'happy' },
  { type: 'excited', color: '#16a34a', colorPlayful: '#f97316', emoji: '🤩', description: 'Excited', quadrant: 'happy' },
  { type: 'content', color: '#15803d', colorPlayful: '#10b981', emoji: '😌', description: 'Content', quadrant: 'happy' },

  // Sad quadrant (Blue → Bright cyan/purple pastels)
  { type: 'sad', color: '#3b82f6', colorPlayful: '#60a5fa', emoji: '😢', description: 'Sad', quadrant: 'sad' },
  { type: 'tired', color: '#2563eb', colorPlayful: '#a78bfa', emoji: '😴', description: 'Tired', quadrant: 'sad' },
  { type: 'inconsolable', color: '#1d4ed8', colorPlayful: '#818cf8', emoji: '😭', description: 'Inconsolable', quadrant: 'sad' },

  // Angry quadrant (Red → Hot pink/coral)
  { type: 'angry', color: '#ef4444', colorPlayful: '#f472b6', emoji: '😠', description: 'Angry', quadrant: 'angry' },
  { type: 'enraged', color: '#dc2626', colorPlayful: '#ec4899', emoji: '🤬', description: 'Enraged', quadrant: 'angry' },
  { type: 'hysterical', color: '#b91c1c', colorPlayful: '#fb7185', emoji: '😱', description: 'Hysterical', quadrant: 'angry' },

  // Calm quadrant (Yellow/Orange → Lime/yellow pastels)
  { type: 'calm', color: '#f59e0b', colorPlayful: '#a3e635', emoji: '😐', description: 'Calm', quadrant: 'calm' },
  { type: 'worried', color: '#d97706', colorPlayful: '#facc15', emoji: '😟', description: 'Worried', quadrant: 'calm' },
  { type: 'energetic', color: '#b45309', colorPlayful: '#fde047', emoji: '⚡', description: 'Energetic', quadrant: 'calm' },
];

export default function EmotionWheel({ title, onSelectionChange, selection, disabled = false, playfulMode = false }: EmotionWheelProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredEmotion, setHoveredEmotion] = useState<EmotionType | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleEmotionClick = (emotion: typeof EMOTIONS[0], index: number) => {
    if (disabled) return;

    // Calculate position based on emotion's position in the wheel
    const angle = (index * 360) / EMOTIONS.length;
    const radian = (angle * Math.PI) / 180;

    // Random intensity between 60-90% for realistic selection
    const intensity = Math.floor(Math.random() * 30) + 60;
    const radius = (intensity / 100) * 120; // Scale to wheel radius

    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius;

    const newSelection: EmotionWheelSelection = {
      emotion: emotion.type,
      intensity: intensity,
      position: { x, y }
    };

    onSelectionChange(newSelection);
  };

  const clearSelection = () => {
    if (!disabled) {
      onSelectionChange(null);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-center">
        <h3 className={cn(
          "text-sm font-semibold mb-1 transition-colors duration-500",
          playfulMode ? "text-purple-900" : "text-white"
        )}>{title}</h3>
      </div>

      <div
        ref={wheelRef}
        className={cn(
          "relative w-60 h-60 rounded-full border-2",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer",
          playfulMode ? "animate-[spin_20s_linear_infinite_reverse]" : ""
        )}
        style={{
          background: playfulMode
            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fcd34d 50%, #fbbf24 75%, #f59e0b 100%)'
            : 'linear-gradient(135deg, rgba(63,63,70,0.8) 0%, rgba(39,39,42,0.9) 50%, rgba(24,24,27,1) 100%)',
          boxShadow: playfulMode
            ? `0 0 40px rgba(251, 191, 36, 0.6), 0 8px 32px rgba(245, 158, 11, 0.4), inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(251, 191, 36, 0.3)`
            : `0 8px 32px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.3)`,
          border: playfulMode ? '3px solid #fbbf24' : '1px solid rgba(113,113,122,0.5)'
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setHoveredEmotion(null);
        }}
      >
        {/* Center circle */}
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          playfulMode && "animate-pulse"
        )}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: playfulMode
                ? 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)'
                : 'linear-gradient(135deg, rgba(82,82,91,0.9) 0%, rgba(39,39,42,1) 100%)',
              boxShadow: playfulMode
                ? `0 0 20px rgba(251, 191, 36, 0.8), 0 4px 12px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.6)`
                : `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)`,
              border: playfulMode ? '2px solid #f59e0b' : '1px solid rgba(113,113,122,0.6)'
            }}
          >
            <span className={cn(
              "text-xs text-center font-medium tracking-wide",
              playfulMode ? "text-amber-900 font-bold" : "text-zinc-300"
            )} style={{ letterSpacing: '0.05em' }}>
              {selection ? (playfulMode ? '✨' : 'SET') : (playfulMode ? '🎯' : 'PICK')}
            </span>
          </div>
        </div>

        {/* Emotion segments */}
        {isMounted && EMOTIONS.map((emotion, index) => {
          const angle = (index * 360) / EMOTIONS.length;
          const radian = (angle * Math.PI) / 180;
          const radius = 90;
          // Round to prevent hydration mismatches
          const x = Math.round(Math.cos(radian) * radius * 100) / 100;
          const y = Math.round(Math.sin(radian) * radius * 100) / 100;

          const isSelected = selection?.emotion === emotion.type;
          const isHovered = hoveredEmotion === emotion.type;

          return (
            <div
              key={emotion.type}
              className={cn(
                "absolute w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer text-xs font-medium transform-gpu",
                isSelected
                  ? "scale-125 z-20"
                  : "hover:scale-110 z-10",
                disabled && "cursor-not-allowed hover:scale-100"
              )}
              style={{
                background: playfulMode
                  ? (isSelected || isHovered
                    ? `linear-gradient(135deg, ${emotion.colorPlayful} 0%, ${emotion.colorPlayful}EE 50%, ${emotion.colorPlayful}DD 100%)`
                    : `linear-gradient(135deg, ${emotion.colorPlayful}AA 0%, ${emotion.colorPlayful}88 100%)`)
                  : (isSelected || isHovered
                    ? `linear-gradient(135deg, ${emotion.color} 0%, ${emotion.color}CC 50%, ${emotion.color}99 100%)`
                    : `linear-gradient(135deg, rgba(82,82,91,0.8) 0%, rgba(39,39,42,0.9) 100%)`),
                boxShadow: playfulMode
                  ? (isSelected
                    ? `0 0 30px ${emotion.colorPlayful}CC, 0 4px 16px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.6)`
                    : isHovered
                    ? `0 0 20px ${emotion.colorPlayful}AA, 0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)`
                    : `0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)`)
                  : (isSelected
                    ? `0 0 20px ${emotion.color}80, 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)`
                    : isHovered
                    ? `0 0 12px ${emotion.color}60, 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)`
                    : '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)'),
                border: playfulMode
                  ? (isSelected
                    ? `2px solid ${emotion.colorPlayful}`
                    : isHovered
                    ? `2px solid ${emotion.colorPlayful}DD`
                    : `1px solid ${emotion.colorPlayful}AA`)
                  : (isSelected
                    ? '1px solid rgba(255,255,255,0.4)'
                    : isHovered
                    ? `1px solid ${emotion.color}80`
                    : '1px solid rgba(113,113,122,0.4)'),
                left: `calc(50% + ${x}px - 16px)`,
                top: `calc(50% + ${y}px - 16px)`,
                animation: playfulMode && (isSelected || isHovered) ? 'bounce 1s ease-in-out infinite' : 'none'
              }}
              onClick={() => handleEmotionClick(emotion, index)}
              onMouseEnter={() => setHoveredEmotion(emotion.type)}
              onMouseLeave={() => setHoveredEmotion(null)}
            >
              <span
                className="text-sm filter"
                style={{
                  filter: isSelected || isHovered
                    ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.8)) brightness(1.1) contrast(1.1)'
                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.6)) brightness(0.9) sepia(0.2)',
                  textShadow: isSelected || isHovered
                    ? '0 0 4px rgba(0,0,0,0.8)'
                    : '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {emotion.emoji}
              </span>

              {/* Enhanced Tooltip */}
              {isHovered && !disabled && (
                <div
                  className="fixed whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-150"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(24,24,27,0.95) 100%)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${emotion.color}40`,
                    borderRadius: '8px',
                    padding: '6px 10px',
                    boxShadow: `
                      0 4px 12px rgba(0,0,0,0.4),
                      0 0 8px ${emotion.color}20,
                      inset 0 1px 0 rgba(255,255,255,0.1)
                    `,
                    zIndex: 9999,
                    left: '50%',
                    top: `calc(50% + ${y}px - 48px)`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="text-xs font-medium text-white tracking-wide">
                    {emotion.description.toUpperCase()}
                  </div>
                  {/* Arrow pointing down */}
                  <div
                    className="absolute top-full left-1/2 transform -translate-x-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: `4px solid ${emotion.color}40`,
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                      zIndex: 9999
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Selection indicator */}
        {selection && (
          <div
            className="absolute w-3 h-3 bg-white rounded-full border-2 border-zinc-800 shadow-lg"
            style={{
              left: `calc(50% + ${selection.position.x}px - 6px)`,
              top: `calc(50% + ${selection.position.y}px - 6px)`,
            }}
          />
        )}

        {/* Intensity rings */}
        <div className="absolute inset-4 rounded-full border border-zinc-700/30" />
        <div className="absolute inset-8 rounded-full border border-zinc-700/20" />
        <div className="absolute inset-12 rounded-full border border-zinc-700/10" />
      </div>

      {/* Clear button */}
      {selection && !disabled && (
        <button
          onClick={clearSelection}
          className="px-3 py-1 text-zinc-200 text-xs font-medium tracking-wide transition-all duration-200 border border-zinc-600 border-opacity-30 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(82,82,91,0.8) 0%, rgba(39,39,42,0.9) 100%)',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)'
          }}
        >
          CLEAR
        </button>
      )}

      {/* Instructions */}
      {!selection && !disabled && (
        <p className="text-xs text-zinc-500 text-center max-w-48">
          Click on an emotion
        </p>
      )}
    </div>
  );
}