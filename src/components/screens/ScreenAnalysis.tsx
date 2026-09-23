'use client';

import { Pill, ArrowLeft, RefreshCw } from 'lucide-react';
import { EASE, Stage } from '@/lib/theme';
import { EmotionWheelSelection } from '@/types';
import StageHeader from '@/components/StageHeader';
import DescentRail from '@/components/DescentRail';
import CassetteLoader from '@/components/CassetteLoader';

interface ScreenAnalysisProps {
  stage: Stage;
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
  stage,
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
  const emotionLabel = primarySelection ? primarySelection.emotion.toUpperCase() : 'UNKNOWN';

  const hasResult = Boolean(cause || choice);

  return (
    <div className="flex flex-col max-w-3xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      {/* Identity + descent read as one connected header system — the rail
          sits close underneath instead of floating with its own gap. */}
      <div className="flex flex-col gap-3 max-[480px]:gap-2">
        <StageHeader stage={stage} align="left" />

        <DescentRail activeIndex={stage.index} />
      </div>

      <div className="mt-6">
      {isAnalyzing || (!hasResult && !error) ? (
        <div className="text-center py-10">
          <CassetteLoader className="mx-auto mb-4" />
          <h3 className="text-sm font-semibold mb-2 tracking-wide" style={{ color: '#2f2e2b' }}>{loadingMessage}</h3>
          <p className="text-xs" style={{ color: '#7d7869' }}>This won&apos;t take long</p>
        </div>
      ) : error ? (
        <div className="flex flex-col gap-4 items-center text-center py-6">
          <p className="text-sm" style={{ color: '#bd5d4c' }}>{error}</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide transition-all duration-200 rounded-sm active:scale-[0.98]"
            style={{
              letterSpacing: '0.05em',
              color: '#5c584f',
              background: '#f2efe7',
              border: '1px solid #e6e2d8',
              transition: `all 0.2s ${EASE}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3b33')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5c584f')}
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
                <span><b style={{ color: INK, fontWeight: 600 }}>Diagnosis:</b> {emotionLabel}, Code {stage.roman}</span>
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
              style={{ letterSpacing: '0.05em', color: '#5c584f', transition: `color 0.2s ${EASE}` }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3b33')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#5c584f')}
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
