'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export type StressLevel =
  | 'none'
  | 'mild'
  | 'light-moderate'
  | 'normal'
  | 'moderate-heavy'
  | 'heavy'
  | 'intense'
  | 'multi-climax';

interface StressSelectorProps {
  title: string;
  onSelectionChange: (selection: StressLevel | null) => void;
  selection: StressLevel | null;
  disabled?: boolean;
  playfulMode?: boolean;
}

const STRESS_LEVELS: {
  level: StressLevel;
  label: string;
  color: string;
  colorPlayful: string;
  intensity: number;
  description: string;
}[] = [
  { level: 'none', label: 'Intolerable lightness', color: '#10b981', colorPlayful: '#7dd3fc', intensity: 0, description: 'Unbearable ease of existence' },
  { level: 'mild', label: 'Low', color: '#22c55e', colorPlayful: '#a3e635', intensity: 1, description: 'Minimal stress level' },
  { level: 'light-moderate', label: 'Optimum', color: '#84cc16', colorPlayful: '#fde047', intensity: 2, description: 'Ideal stress balance' },
  { level: 'normal', label: 'Moderate', color: '#eab308', colorPlayful: '#fbbf24', intensity: 3, description: 'Manageable stress' },
  { level: 'moderate-heavy', label: 'Overload', color: '#f97316', colorPlayful: '#fb923c', intensity: 4, description: 'Excessive demands' },
  { level: 'heavy', label: 'Burnout', color: '#ef4444', colorPlayful: '#f87171', intensity: 5, description: 'Exhaustion threshold' },
  { level: 'multi-climax', label: 'Multi-\nclimax', color: '#991b1b', colorPlayful: '#fb7185', intensity: 6, description: 'Peak stress complexity' },
];

export default function StressSelector({ title, onSelectionChange, selection, disabled = false, playfulMode = false }: StressSelectorProps) {
  const [hoveredLevel, setHoveredLevel] = useState<StressLevel | null>(null);

  const handleLevelClick = (level: StressLevel) => {
    if (disabled) return;

    if (selection === level) {
      // Deselect if clicking the same level
      onSelectionChange(null);
    } else {
      onSelectionChange(level);
    }
  };

  const clearSelection = () => {
    if (!disabled) {
      onSelectionChange(null);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="text-center">
        <h3 className={cn(
          "text-sm font-semibold mb-1 transition-colors duration-500",
          playfulMode ? "text-purple-900" : "text-white"
        )}>{title}</h3>
      </div>

      {/* Vertical Slider */}
      <div
        className={cn(
          "relative rounded-lg px-3 py-3 border h-72 w-40 transition-all duration-500"
        )}
        style={{
          background: playfulMode
            ? 'linear-gradient(180deg, #fb7185 0%, #fb7185 15%, #f87171 29%, #fb923c 43%, #fbbf24 57%, #fde047 72%, #a3e635 86%, #7dd3fc 100%)'
            : 'linear-gradient(180deg, #991b1b 0%, #991b1b 15%, #ef4444 29%, #f97316 43%, #eab308 57%, #84cc16 72%, #22c55e 86%, #10b981 100%)',
          borderColor: playfulMode ? 'rgba(251, 191, 36, 0.4)' : 'rgba(63, 63, 70, 0.5)',
          boxShadow: playfulMode
            ? '0 4px 20px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
            : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}
      >

        {/* Level indicators */}
        <div className="relative h-full flex flex-col justify-between items-start py-2">
          {STRESS_LEVELS.slice().reverse().map((stressLevel, index) => {
            const isSelected = selection === stressLevel.level;
            const isHovered = hoveredLevel === stressLevel.level;

            return (
              <div
                key={stressLevel.level}
                className="flex items-center cursor-pointer relative group w-full"
                onClick={() => handleLevelClick(stressLevel.level)}
                onMouseEnter={() => setHoveredLevel(stressLevel.level)}
                onMouseLeave={() => setHoveredLevel(null)}
              >
                {/* Level indicator */}
                <div
                  className={cn(
                    "w-4 h-4 rounded-full transition-all duration-300 relative z-10",
                    isSelected
                      ? "scale-150"
                      : "scale-100 hover:scale-110",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                  style={{
                    backgroundColor: isSelected
                      ? 'white'
                      : isHovered
                      ? 'rgba(255, 255, 255, 0.8)'
                      : 'rgba(255, 255, 255, 0.4)',
                    border: isSelected
                      ? `3px solid ${playfulMode ? stressLevel.colorPlayful : stressLevel.color}`
                      : isHovered
                      ? `2px solid rgba(255, 255, 255, 0.8)`
                      : `2px solid rgba(255, 255, 255, 0.5)`,
                    boxShadow: isSelected
                      ? playfulMode
                        ? `0 0 25px ${stressLevel.colorPlayful}DD, 0 0 12px ${stressLevel.colorPlayful}AA, 0 4px 8px rgba(0,0,0,0.3)`
                        : `0 0 20px ${stressLevel.color}AA, 0 0 10px ${stressLevel.color}80, 0 4px 8px rgba(0,0,0,0.3)`
                      : isHovered
                      ? '0 2px 8px rgba(0,0,0,0.2)'
                      : '0 1px 4px rgba(0,0,0,0.15)'
                  }}
                />

                {/* Level label */}
                <span
                  className={cn(
                    "text-xs font-medium ml-3 transition-all duration-300 whitespace-pre-line",
                    isSelected
                      ? "font-bold"
                      : "font-medium hover:font-semibold"
                  )}
                  style={{
                    fontSize: '10px',
                    lineHeight: '11px',
                    color: playfulMode
                      ? (isSelected ? '#6b21a8' : isHovered ? '#7e22ce' : '#581c87')
                      : 'white',
                    textShadow: isSelected
                      ? playfulMode
                        ? `0 0 12px ${stressLevel.colorPlayful}, 0 2px 4px rgba(0,0,0,0.4)`
                        : `0 0 10px ${stressLevel.color}, 0 2px 4px rgba(0,0,0,0.5)`
                      : playfulMode
                      ? '0 1px 2px rgba(0,0,0,0.2)'
                      : '0 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {stressLevel.label}
                </span>

                {/* Tooltip */}
                {isHovered && !disabled && (
                  <div className="absolute whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-150 left-full ml-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(24,24,27,0.95) 100%)',
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${playfulMode ? stressLevel.colorPlayful : stressLevel.color}40`,
                      borderRadius: '8px',
                      padding: '6px 10px',
                      boxShadow: `
                        0 4px 12px rgba(0,0,0,0.4),
                        0 0 8px ${playfulMode ? stressLevel.colorPlayful : stressLevel.color}20,
                        inset 0 1px 0 rgba(255,255,255,0.1)
                      `,
                      zIndex: 9999,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <div className="text-xs font-medium text-white tracking-wide">
                      {stressLevel.description.toUpperCase()}
                    </div>
                    {/* Arrow pointing left */}
                    <div
                      className="absolute top-1/2 right-full transform -translate-y-1/2"
                      style={{
                        width: 0,
                        height: 0,
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                        borderRight: `4px solid ${playfulMode ? stressLevel.colorPlayful : stressLevel.color}40`,
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
        <p className="text-xs text-zinc-500 text-center">
          Select stress level
        </p>
      )}
    </div>
  );
}