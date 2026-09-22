'use client';

import { ArrowDownToLine, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE, CTA_BACKGROUND, CTA_SHADOW, CTA_TEXT_SHADOW } from '@/lib/theme';
import { EmotionWheelSelection } from '@/types';
import EmotionWheel from '@/components/EmotionWheel';

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
      {/* A faint surface just behind the instrument — not a page-wide
          card. The darkness itself should carry the rest of the page.
          Emotion and intensity are now a single wheel: angle picks the
          emotion, radial drag distance snaps to an intensity tier. */}
      <div
        className="flex items-start justify-center rounded-2xl px-8 py-6"
        style={{ background: 'rgba(255,255,255,0.008)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }}
      >
        <EmotionWheel selection={primarySelection} onSelectionChange={onPrimarySelectionChange} />
      </div>

      <div className="mt-6 w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-400 text-center" style={{ letterSpacing: '0.05em' }}>
            What 1st world setback was encountered today?
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
            placeholder="What minor inconvenience shattered your fragile peace today?"
            className="w-full px-4 py-3 rounded-sm text-sm text-center resize-none focus:outline-none focus:ring-1 transition-all duration-200 font-normal bg-white/[0.015] text-zinc-100 focus:ring-red-500/30 placeholder-zinc-600"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              lineHeight: '1.5',
              height: '80px',
              transition: `all 0.2s ${EASE}`,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35), inset 0 0 0 0.5px rgba(255,255,255,0.03)',
            }}
          />
          <p className="text-[10px] text-zinc-600 text-center" style={{ letterSpacing: '0.02em' }}>
            Press Enter to submit · Shift+Enter for a new line
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={cn(
            "px-10 py-4 font-semibold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 rounded-sm active:scale-[0.98]",
            canSubmit ? "text-red-400" : "bg-white/[0.02] text-zinc-600 cursor-not-allowed"
          )}
          style={{
            transition: `all 0.2s ${EASE}`,
            letterSpacing: '0.08em',
            background: canSubmit ? CTA_BACKGROUND : undefined,
            boxShadow: canSubmit ? CTA_SHADOW : 'inset 0 1px 3px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.04)',
            textShadow: canSubmit ? CTA_TEXT_SHADOW : undefined,
          }}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-red-400"></div>
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
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
            style={{ letterSpacing: '0.05em', transition: `color 0.2s ${EASE}` }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
