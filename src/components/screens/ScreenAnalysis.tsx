'use client';

import { Pill, ArrowLeft, RefreshCw } from 'lucide-react';
import {
  calculateDamageScore,
  EASE,
  CTA_BACKGROUND,
  CTA_SHADOW,
  CTA_TEXT_SHADOW,
  Circle,
} from '@/lib/theme';
import { EmotionWheelSelection } from '@/types';
import CircleHeader from '@/components/CircleHeader';
import DescentRail from '@/components/DescentRail';
import CassetteLoader from '@/components/CassetteLoader';

interface ScreenAnalysisProps {
  circle: Circle;
  primarySelection: EmotionWheelSelection | null;
  cause: string | null;
  choice: string | null;
  isAnalyzing: boolean;
  loadingMessage: string;
  error: string | null;
  onContinue: () => void;
  onRetry: () => void;
  onBack: () => void;
}

export default function ScreenAnalysis({
  circle,
  primarySelection,
  cause,
  choice,
  isAnalyzing,
  loadingMessage,
  error,
  onContinue,
  onRetry,
  onBack,
}: ScreenAnalysisProps) {
  const damageScore = primarySelection ? calculateDamageScore(primarySelection.emotion, primarySelection.stressLevel) : 0;

  const hasResult = Boolean(cause || choice);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      {/* One header cluster: circle identity (numeral + name, single row)
          on the left, Emotional Damage aligned to the same top edge on the
          right — not a floating metric. */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-x-4 gap-y-3 max-w-xl">
        <CircleHeader circle={circle} align="left" />
        {primarySelection && (
          <div className="justify-self-start sm:justify-self-end text-left sm:text-right">
            <span className="text-xs font-semibold uppercase tracking-wide text-red-400" style={{ letterSpacing: '0.08em' }}>
              Emotional Damage
            </span>
            <div className="text-4xl font-bold font-mono tabular-nums text-red-500 mt-1">
              {damageScore}
              <span className="text-sm opacity-60 ml-1">/1000</span>
            </div>
          </div>
        )}
      </div>

      <DescentRail activeIndex={circle.index} />

      {isAnalyzing || (!hasResult && !error) ? (
        <div className="text-center py-10 text-zinc-500">
          <CassetteLoader className="mx-auto mb-4" />
          <h3 className="text-sm font-semibold mb-2 tracking-wide">{loadingMessage}</h3>
          <p className="text-xs opacity-70">This won&apos;t take long</p>
        </div>
      ) : error ? (
        <div className="flex flex-col gap-4 items-center text-center py-6">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all duration-200 rounded-sm active:scale-[0.98] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300"
            style={{ letterSpacing: '0.05em', transition: `all 0.2s ${EASE}`, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.05)' }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      ) : (
        // Carved into the page rather than assembled from cards: no boxed
        // Cause/Choice panels, just a hairline top rule and a divider
        // between the two, sharing the same left axis as the header above.
        <div className="flex flex-col" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {cause && (
            <div className="pt-6 pb-6" style={{ borderBottom: choice ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-3" style={{ letterSpacing: '0.08em' }}>
                Cause
              </h3>
              <p className="leading-relaxed text-sm text-zinc-100 max-w-[600px]" style={{ fontFamily: 'var(--font-geist-sans)', lineHeight: '1.6' }}>
                {cause}
              </p>
            </div>
          )}

          {choice && (
            <div className="pt-6 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-3" style={{ letterSpacing: '0.08em' }}>
                Cure
              </h3>
              <p className="leading-relaxed text-sm text-zinc-100 max-w-[600px]" style={{ fontFamily: 'var(--font-geist-sans)', lineHeight: '1.6' }}>
                {choice}
              </p>
            </div>
          )}

          <button
            onClick={onContinue}
            className="mt-6 w-full py-5 font-semibold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 rounded-sm active:scale-[0.98] text-red-400"
            style={{
              transition: `all 0.2s ${EASE}`,
              letterSpacing: '0.08em',
              background: CTA_BACKGROUND,
              boxShadow: CTA_SHADOW,
              textShadow: CTA_TEXT_SHADOW,
            }}
          >
            <Pill className="h-4 w-4" />
            Get Prescription
          </button>

          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
              style={{ letterSpacing: '0.05em', transition: `color 0.2s ${EASE}` }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
