'use client';

import { Pill, ArrowLeft, RefreshCw } from 'lucide-react';
import { EASE, Stage } from '@/lib/theme';
import StageHeader from '@/components/StageHeader';
import DescentRail from '@/components/DescentRail';
import CassetteLoader from '@/components/CassetteLoader';

interface ScreenAnalysisProps {
  stage: Stage;
  triggerLabel: string | null;
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
  triggerLabel,
  cause,
  choice,
  isAnalyzing,
  loadingMessage,
  error,
  onContinue,
  onRetry,
  onBack,
}: ScreenAnalysisProps) {
  const diagnosisLabel = triggerLabel ? triggerLabel.toUpperCase() : 'UNKNOWN';

  const hasResult = Boolean(cause || choice);
  const isLoading = isAnalyzing || (!hasResult && !error);

  return (
    <div className="flex flex-col max-w-3xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      {/* The diagnosis stage is revealed alongside the result, not before —
          showing "IX — VITUTUS MAXIMUS" while the loader still reads
          "Summoning the void..." undercuts the reveal. Header + rail only
          mount once there's an actual result (or an error) to anchor them. */}
      {!isLoading && (
        <div className="flex flex-col gap-1.5 max-[480px]:gap-1">
          <StageHeader stage={stage} align="left" />

          <DescentRail activeIndex={stage.index} />
        </div>
      )}

      <div className={isLoading ? undefined : 'mt-6'}>
      {isLoading ? (
        // min-h + flex centering (not the page shell's min-h-dvh — this is
        // a transient, non-scrolling state, so it doesn't carry the same
        // Safari toolbar-jump risk) so the loader sits in the visual middle
        // of the screen instead of pinned to the top with dead space below.
        <div className="min-h-[65dvh] flex flex-col items-center justify-center text-center">
          <CassetteLoader className="mx-auto mb-6" />
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
              className="p-[30px_32px_28px] max-[480px]:p-6"
              style={{
                background: PAPER_LIGHT,
                color: INK,
                fontFamily: 'var(--font-plex-sans), Arial, sans-serif',
                border: `1px solid ${INK}26`,
                boxShadow: '0 6px 18px -14px rgba(43,42,38,0.4), 0 1px 0 rgba(255,255,255,0.6) inset',
              }}
            >
              {/* Stacks on mobile (name / subtitle / the divider that's
                  already the block's own border-bottom) instead of forcing
                  the desktop single-line lockup into a narrow viewport. */}
              <div
                className="flex justify-between items-baseline flex-wrap gap-2 max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-1"
                style={{ borderBottom: `1px solid ${INK}26`, paddingBottom: 10 }}
              >
                <h2 className="uppercase m-0 font-bold text-[17px]" style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.08em' }}>
                  Epicrisis
                </h2>
                <span className="uppercase text-[9.5px] max-[480px]:text-[10.5px]" style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.04em', color: STEEL }}>
                  Clinical Summary — Form CATH-2
                </span>
              </div>

              <div className="flex gap-6 flex-wrap text-[11px] max-[480px]:text-[12px]" style={{ color: INK_SOFT, margin: '10px 0 4px' }}>
                <span><b style={{ color: INK, fontWeight: 600 }}>Diagnosis:</b> {diagnosisLabel}, Code {stage.roman}</span>
              </div>

              {cause && (
                <div className="mt-5">
                  <h3 className="uppercase m-0 font-bold text-[13px] max-[480px]:text-[15px]" style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.07em', marginBottom: 8 }}>
                    1. Incident Summary
                  </h3>
                  <p className="m-0 max-w-[62ch] min-w-0 break-words text-[13.5px] max-[480px]:text-[19px] leading-[1.55]" style={{ color: INK_SOFT }}>{cause}</p>
                </div>
              )}

              {choice && (
                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${INK}1a` }}>
                  <h3 className="uppercase m-0 font-bold text-[13px] max-[480px]:text-[15px]" style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.07em', marginBottom: 8 }}>
                    2. Recommended Corrective Action
                  </h3>
                  <p className="m-0 max-w-[62ch] min-w-0 break-words text-[13.5px] max-[480px]:text-[19px] leading-[1.55]" style={{ color: INK_SOFT }}>{choice}</p>
                </div>
              )}

              {/* Second "real" citation, same deadpan-legitimate spirit as
                  the Vitutus study QR on ReceiptCard — small print, no QR
                  this time, easy to skim past unless you're actually
                  reading the fine print. Echoes the "matching, not venting"
                  beat from the choice text above. */}
              {choice && (
                <p
                  className="uppercase m-0 mt-4 pt-3 text-[8.5px] max-[480px]:text-[10px] leading-[1.5]"
                  style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.03em', color: STEEL, borderTop: `1px solid ${INK}1a` }}
                >
                  Treatment protocol per Sharman &amp; Dingle (2015), Front. Hum. Neurosci. — extreme music does not escalate anger; it matches it.
                </p>
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
