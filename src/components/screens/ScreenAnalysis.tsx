'use client';

import { Pill, ArrowLeft, RefreshCw } from 'lucide-react';
import { calculateDamageScore, EASE, Circle } from '@/lib/theme';
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

// Paper tones for the Epicrisis card only — a single clinical-document
// artifact dropped into the otherwise unchanged dark page, not a full
// page reskin. See project notes on the "Descent Memo" design direction.
const PAPER_LIGHT = '#f6f3ea';
const INK = '#2b2a26';
const INK_SOFT = '#4a473f';
const STEEL = '#8a8577';
const CORAL = '#bd5d4c';

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
  const emotionLabel = primarySelection ? primarySelection.emotion.toUpperCase() : 'UNKNOWN';

  const hasResult = Boolean(cause || choice);

  return (
    <div className="flex flex-col max-w-3xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      {/* Identity + damage + descent read as one connected header system,
          not three separate bands — the rail sits close underneath instead
          of floating with its own equal-weight gap. */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-x-4 gap-y-2">
          <CircleHeader circle={circle} align="left" />
          {primarySelection && (
            <div className="justify-self-start sm:justify-self-end text-left sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ letterSpacing: '0.08em', color: CORAL }}>
                Emotional Damage
              </span>
              <div className="text-4xl font-bold font-mono tabular-nums mt-1" style={{ color: CORAL }}>
                {damageScore}
                <span className="text-sm opacity-60 ml-1">/1000</span>
              </div>
            </div>
          )}
        </div>

        <DescentRail activeIndex={circle.index} />
      </div>

      <div className="mt-6">
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
        <div className="flex flex-col">
          {/* Epicrisis — a printed case record, not a bordered UI card:
              warm paper tone, hairline border, soft lift instead of a hard
              drop shadow, generous document-like padding. */}
          <div className="pt-4">
            <div
              style={{
                background: PAPER_LIGHT,
                color: INK,
                fontFamily: 'var(--font-plex-sans), Arial, sans-serif',
                border: `1px solid ${INK}26`,
                boxShadow: '0 6px 18px -14px rgba(43,42,38,0.4), 0 1px 0 rgba(255,255,255,0.6) inset',
                padding: '30px 32px 28px',
              }}
            >
              <div className="flex justify-between items-baseline flex-wrap gap-2" style={{ borderBottom: `1px solid ${INK}26`, paddingBottom: 10 }}>
                <h2 className="uppercase m-0 font-bold" style={{ fontFamily: 'var(--font-special-elite), monospace', fontSize: 17, letterSpacing: '0.08em' }}>
                  Epicrisis
                </h2>
                <span className="uppercase" style={{ fontFamily: 'var(--font-special-elite), monospace', fontSize: 9.5, letterSpacing: '0.04em', color: STEEL }}>
                  Clinical Summary — Form CATH-2
                </span>
              </div>

              <div className="flex gap-6 flex-wrap" style={{ fontSize: 11, color: INK_SOFT, margin: '10px 0 4px' }}>
                <span><b style={{ color: INK, fontWeight: 600 }}>Diagnosis:</b> {emotionLabel}, Code {circle.roman}</span>
                <span><b style={{ color: INK, fontWeight: 600 }}>Attending:</b> Dr. Catharsis, M.D.</span>
              </div>

              {cause && (
                <div className="mt-5">
                  <h3 className="uppercase m-0 font-bold" style={{ fontFamily: 'var(--font-special-elite), monospace', fontSize: 13, letterSpacing: '0.07em', marginBottom: 8 }}>
                    1. Incident Summary
                  </h3>
                  <p className="m-0" style={{ maxWidth: '62ch', fontSize: 13.5, color: INK_SOFT, lineHeight: 1.55 }}>{cause}</p>
                </div>
              )}

              {choice && (
                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${INK}1a` }}>
                  <h3 className="uppercase m-0 font-bold" style={{ fontFamily: 'var(--font-special-elite), monospace', fontSize: 13, letterSpacing: '0.07em', marginBottom: 8 }}>
                    2. Recommended Corrective Action
                  </h3>
                  <p className="m-0" style={{ maxWidth: '62ch', fontSize: 13.5, color: INK_SOFT, lineHeight: 1.55 }}>{choice}</p>
                </div>
              )}
            </div>
          </div>

          {/* Narrow, centered action — a ritual step, not a form submit
              control spanning the page. Cream fill, thin coral border. */}
          <button
            onClick={onContinue}
            className="mt-7 mx-auto w-full max-w-[280px] py-3.5 font-semibold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 rounded-lg active:scale-[0.98]"
            style={{
              transition: `all 0.2s ${EASE}`,
              letterSpacing: '0.08em',
              background: PAPER_LIGHT,
              color: CORAL,
              border: `1px solid ${CORAL}`,
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${CORAL}14`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = PAPER_LIGHT)}
          >
            <Pill className="h-4 w-4" />
            Get Prescription
          </button>

          <div className="flex items-center justify-center gap-6 mt-5">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide transition-colors duration-200"
              style={{ letterSpacing: '0.05em', color: '#a6a297', transition: `color 0.2s ${EASE}` }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#726f66')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#a6a297')}
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Selection
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
