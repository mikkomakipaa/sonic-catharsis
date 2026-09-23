'use client';

import { ArrowDownToLine, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE, CTA_BACKGROUND, CTA_SHADOW, CTA_TEXT_SHADOW, CTA_TEXT_COLOR } from '@/lib/theme';
import { TriggerSelection } from '@/types';
import ClassificationGrid from '@/components/ClassificationGrid';
import IntensitySlider from '@/components/IntensitySlider';

interface StateOfMindPanelProps {
  selection: TriggerSelection | null;
  onSelectionChange: (selection: TriggerSelection | null) => void;
  incidentText: string;
  onIncidentTextChange: (value: string) => void;
  isProcessing: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

// Situation-first flow: incident (language) -> trigger (visual
// classification) -> intensity (magnitude). The text field is the dominant
// first interaction, not a comment bolted onto a selector — see
// docs/model.md for the full rationale behind this ordering.
export default function StateOfMindPanel({
  selection,
  onSelectionChange,
  incidentText,
  onIncidentTextChange,
  isProcessing,
  canSubmit,
  onSubmit,
  onReset,
}: StateOfMindPanelProps) {
  const showReset = Boolean(selection || incidentText);

  return (
    <div className="flex flex-col items-center">
      {/* The incident — what happened. This is the page's dominant first
          interaction, not an optional comment attached to a selector. */}
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center">
          <label className="text-[10px] font-medium uppercase text-center mb-1.5" style={{ letterSpacing: '0.02em', color: '#5c584f' }}>
            What petty injustice did you endure today?
          </label>
          <textarea
            value={incidentText}
            onChange={(e) => onIncidentTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            placeholder="What exactly ruined an otherwise perfectly acceptable day?"
            className="w-full px-5 py-4 rounded-md text-sm text-center resize-none focus:outline-none focus:ring-1 transition-all duration-200 font-normal focus:ring-[#c98a4b]/30 placeholder-[#726c5d]"
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
        </div>
      </div>

      {/* Classification — what kind of frustration this is. A 3x3 checkbox
          matrix, the visual centerpiece of the page; no separate "trigger"
          label needed, the question above the grid already explains the
          control. */}
      <p
        className="text-center uppercase mt-8"
        style={{ fontSize: '11px', letterSpacing: '0.1em', fontWeight: 600, color: '#7d7869' }}
      >
        What kind of bullshit was it?
      </p>
      <div className="mt-4 w-full">
        <ClassificationGrid selection={selection} onSelectionChange={onSelectionChange} />
      </div>

      {/* Intensity — how strongly it's affecting them. Quieter and more
          compact than the trigger grid above; a separate, independent
          axis, not a proxy for which trigger was picked. */}
      <p
        className="text-center uppercase mt-5"
        style={{ fontSize: '10px', letterSpacing: '0.08em', fontWeight: 600, color: '#7d7869' }}
      >
        How bad is it?
      </p>
      <div className="mt-2">
        <IntensitySlider
          value={selection?.intensity ?? null}
          disabled={!selection}
          onChange={(tier) => {
            if (!selection) return;
            onSelectionChange({ ...selection, intensity: tier });
          }}
          onClear={() => onSelectionChange(null)}
        />
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
            color: canSubmit ? CTA_TEXT_COLOR : '#5c584f',
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
              <span className="font-bold">Begin Diagnosis</span>
            </>
          )}
        </button>

        {showReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide transition-colors duration-200"
            style={{ letterSpacing: '0.05em', color: '#5c584f', transition: `color 0.2s ${EASE}` }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3b33')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5c584f')}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
