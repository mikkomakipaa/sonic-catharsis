'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  EASE,
  Stage,
  SECTION_LABEL_STYLE,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  DIVIDER_COLOR,
  TREATMENT_ACCENT_BG,
  TREATMENT_ACCENT_BG_HOVER,
  TREATMENT_ACCENT_BORDER,
  TREATMENT_ACCENT_TEXT,
} from '@/lib/theme';
import StageHeader from '@/components/StageHeader';
import DescentRail from '@/components/DescentRail';
import DiagnosticReceipt from '@/components/DiagnosticReceipt';

interface ScreenAnalysisProps {
  stage: Stage;
  cause: string | null;
  choice: string | null;
  subgenre: string | null;
  isAnalyzing: boolean;
  error: string | null;
  onContinue: () => void;
  onRetry: () => void;
  onBack: () => void;
}

// Two-tone capsule for the Get Prescription button — flat colors (no
// gradient) split down the capsule's own long axis, matching a real pill's
// two halves rather than a generic single-color outline icon.
function CapsuleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <clipPath id="capsuleClip">
          <rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-45 12 12)" />
        </clipPath>
      </defs>
      <g clipPath="url(#capsuleClip)">
        <rect x="2" y="9" width="10" height="6" fill="#c85f4d" transform="rotate(-45 12 12)" />
        <rect x="12" y="9" width="10" height="6" fill="#e59a5b" transform="rotate(-45 12 12)" />
      </g>
      <rect x="2" y="9" width="20" height="6" rx="3" fill="none" stroke="#a8503f" strokeWidth="1.2" transform="rotate(-45 12 12)" />
    </svg>
  );
}

export default function ScreenAnalysis({
  stage,
  cause,
  choice,
  subgenre,
  isAnalyzing,
  error,
  onContinue,
  onRetry,
  onBack,
}: ScreenAnalysisProps) {
  const hasResult = Boolean(cause || choice);
  const isLoading = isAnalyzing || (!hasResult && !error);

  return (
    <div className="flex flex-col max-w-3xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      {/* The diagnosis stage is revealed alongside the result, not before —
          showing "IX — VITUTUS MAXIMUS" while the loader still reads
          "Diagnosing the situation..." undercuts the reveal. Header + rail
          only mount once there's an actual result (or an error) to anchor
          them. */}
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
          <DiagnosticReceipt />
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
        <div className="flex flex-col pt-4">
          {/* The Diagnosis IS the page now — no paper card, no border, no
              shadow. Epicrisis survives only as a tiny metadata kicker
              (below); the dominant heading is DIAGNOSIS itself, colored by
              the active stage's severity accent (stage.color). See
              docs/design_guidelines.md "Design Philosophy". */}
          <span
            className="uppercase text-[9.5px] max-[480px]:text-[10.5px]"
            style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.04em', color: TEXT_TERTIARY }}
          >
            Clinical Note / Epicrisis 001
          </span>

          {/* Trigger label + stage code used to sit here (right-aligned)
              but duplicated the rail's own roman numeral above — dropped.
              The eyebrow stays as the section's lead-in. */}
          <div className="pb-2 mt-1.5" style={{ borderBottom: `1px solid ${DIVIDER_COLOR}` }}>
            <span style={{ ...SECTION_LABEL_STYLE, textAlign: 'left' }}>Diagnosis</span>
          </div>

          {cause && (
            <div className="mt-6">
              <span style={{ ...SECTION_LABEL_STYLE, textAlign: 'left' }}>Incident Summary</span>
              <p
                className="m-0 mt-2 max-w-[62ch] min-w-0 break-words text-[13px] max-[480px]:text-[19px] leading-[1.45]"
                style={{ color: TEXT_SECONDARY, fontFamily: 'var(--font-plex-sans), Arial, sans-serif' }}
              >
                {cause}
              </p>
            </div>
          )}

          {choice && (
            <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${DIVIDER_COLOR}` }}>
              <span style={{ ...SECTION_LABEL_STYLE, textAlign: 'left' }}>Prescribed Response</span>
              {subgenre && (
                <div
                  className="uppercase font-bold text-[15px] max-[480px]:text-[17px] mt-2"
                  style={{ color: stage.color }}
                >
                  {subgenre}
                </div>
              )}
              <p
                className="m-0 mt-2 max-w-[62ch] min-w-0 break-words text-[13px] max-[480px]:text-[19px] leading-[1.45]"
                style={{ color: TEXT_SECONDARY, fontFamily: 'var(--font-plex-sans), Arial, sans-serif' }}
              >
                {choice}
              </p>
            </div>
          )}

          {/* Same deadpan-legitimate citation as before, just off the old
              paper-card ink tint and onto the shared neutral tokens. */}
          {choice && (
            <p
              className="uppercase m-0 mt-5 pt-3 text-[8.5px] max-[480px]:text-[10px] leading-[1.5]"
              style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.03em', color: TEXT_TERTIARY, borderTop: `1px solid ${DIVIDER_COLOR}` }}
            >
              Treatment protocol per Sharman &amp; Dingle (2015), Front. Hum. Neurosci. — extreme music does not escalate anger; it matches it.
            </p>
          )}

          {/* Narrow, centered action — a ritual step, not a form submit
              control spanning the page. Filled pale terracotta, not the
              cream-fill/coral-outline pattern other buttons use — this is
              the ritual's actual pivot action. */}
          <button
            onClick={onContinue}
            className="mt-7 mx-auto w-full max-w-[280px] py-3.5 font-semibold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 rounded-lg active:scale-[0.98]"
            style={{
              transition: `all 0.2s ${EASE}`,
              letterSpacing: '0.08em',
              background: TREATMENT_ACCENT_BG,
              color: TREATMENT_ACCENT_TEXT,
              border: `1px solid ${TREATMENT_ACCENT_BORDER}`,
              boxShadow: `0 2px 6px -2px ${TREATMENT_ACCENT_BORDER}40`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = TREATMENT_ACCENT_BG_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = TREATMENT_ACCENT_BG)}
          >
            <CapsuleIcon className="h-4 w-4" />
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
