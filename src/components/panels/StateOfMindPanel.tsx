'use client';

import { ArrowDownToLine, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE, CTA_BACKGROUND, CTA_SHADOW, CTA_TEXT_SHADOW, CTA_TEXT_COLOR } from '@/lib/theme';
import { EmotionWheelSelection } from '@/types';
import EmotionWheel from '@/components/EmotionWheel';
import IntensitySlider from '@/components/IntensitySlider';

interface StateOfMindPanelProps {
  primarySelection: EmotionWheelSelection | null;
  onPrimarySelectionChange: (selection: EmotionWheelSelection | null) => void;
  eventDescription: string;
  onEventDescriptionChange: (value: string) => void;
  isProcessing: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

export default function StateOfMindPanel({
  primarySelection,
  onPrimarySelectionChange,
  eventDescription,
  onEventDescriptionChange,
  isProcessing,
  canSubmit,
  onSubmit,
  onReset,
}: StateOfMindPanelProps) {
  const showReset = Boolean(primarySelection || eventDescription);

  return (
    <div className="flex flex-col items-center">
      {/* No card surface — the wheel sits directly on the page background as
          the page's main instrument, not a widget boxed inside a panel.
          Emotion and intensity are two separate controls now: the wheel
          picks the emotion only, the slider underneath dials intensity —
          decoupled so each interaction stays legible on its own. */}
      <EmotionWheel selection={primarySelection} onSelectionChange={onPrimarySelectionChange} />

      <div className="mt-4">
        <IntensitySlider
          value={primarySelection?.stressLevel ?? null}
          disabled={!primarySelection}
          onChange={(tier) => {
            if (!primarySelection) return;
            onPrimarySelectionChange({ ...primarySelection, stressLevel: tier });
          }}
          onClear={() => onPrimarySelectionChange(null)}
        />
      </div>

      <div className="mt-4 w-full max-w-2xl">
        <div className="flex flex-col items-center">
          <label className="text-[10px] font-medium uppercase text-center mb-1.5" style={{ letterSpacing: '0.02em', color: '#6b675e' }}>
            What petty injustice did you endure today?
          </label>
          <textarea
            value={eventDescription}
            onChange={(e) => onEventDescriptionChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            placeholder="What exactly ruined an otherwise perfectly acceptable day?"
            className="w-full px-5 py-4 rounded-md text-sm text-center resize-none focus:outline-none focus:ring-1 transition-all duration-200 font-normal focus:ring-[#c98a4b]/30 placeholder-zinc-500"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              lineHeight: '1.5',
              height: '80px',
              color: '#2f2e2b',
              background: '#faf8f3',
              border: '1px solid #ece7db',
              transition: `all 0.2s ${EASE}`,
            }}
          />
          <p className="text-[10px] text-zinc-600 text-center mt-1.5" style={{ letterSpacing: '0.02em' }}>
            Press Enter to submit · Shift+Enter for a new line
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={cn(
            "px-10 py-4 font-semibold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 rounded-lg active:scale-[0.98]",
            canSubmit ? undefined : "cursor-not-allowed"
          )}
          style={{
            transition: `all 0.2s ${EASE}`,
            letterSpacing: '0.08em',
            background: canSubmit ? CTA_BACKGROUND : '#f2efe7',
            color: canSubmit ? CTA_TEXT_COLOR : '#a6a297',
            border: canSubmit ? 'none' : '1px solid #e6e2d8',
            boxShadow: canSubmit ? CTA_SHADOW : 'none',
            textShadow: canSubmit ? CTA_TEXT_SHADOW : undefined,
          }}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current"></div>
              <span className="font-bold">Analyzing...</span>
            </>
          ) : (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              <span className="font-bold">Begin Descent</span>
            </>
          )}
        </button>

        {showReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide transition-colors duration-200"
            style={{ letterSpacing: '0.05em', color: '#a6a297', transition: `color 0.2s ${EASE}` }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#726f66')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#a6a297')}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
