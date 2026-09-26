'use client';

import { Music, Radio } from 'lucide-react';
import {
  Stage,
  SURFACE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  DIVIDER_COLOR,
  TREATMENT_ACCENT_BORDER,
  TREATMENT_ACCENT_TEXT,
} from '@/lib/theme';
import { Playlist } from '@/types';
import PrescriptionCalibration from '@/components/PrescriptionCalibration';

interface ResultsPanelProps {
  playlist: Playlist | null;
  isProcessing: boolean;
  isAnalyzing: boolean;
  reasoning: string | null;
  triggerLabel?: string | null;
  stage?: Stage | null;
  subgenre?: string | null;
  onViewReceipt?: () => void;
}

export default function ResultsPanel({ playlist, isProcessing, isAnalyzing, reasoning, triggerLabel, stage, subgenre, onViewReceipt }: ResultsPanelProps) {
  if (!playlist) {
    // No background/border box around the loading state itself — see
    // docs/design_guidelines.md → Loading States. PrescriptionCalibration
    // uses document typography (like DiagnosticReceipt on the matcher
    // stage) but is still not wrapped in a card.
    return (
      <div className="w-full pt-2">
        <div className="text-center">
          {isProcessing && !isAnalyzing && reasoning ? (
            <PrescriptionCalibration />
          ) : (
            <>
              <Music className="h-10 w-10 mx-auto mb-4" style={{ color: '#7d7869' }} />
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: '#2f2e2b' }}>Artists</h3>
              <p className="text-xs" style={{ color: '#7d7869' }}>Complete analysis first</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // stage.index alone can't distinguish "unassessed" (SURFACE) from
  // "assessed, pseudo-vitutus" (PSEUDO_VITUTUS_STAGE) — both are index 0 by
  // design (see lib/theme.ts) — so this compares by reference instead.
  const severityLabel = stage && stage !== SURFACE ? `${stage.roman} · ${stage.name.toUpperCase()}` : null;
  return (
    <div
      key={playlist.id}
      // No card/paper background — sits directly on the page, same as the
      // Diagnosis screen. Same max-w-3xl-derived width as the Diagnosis
      // screen too (inherited from ScreenDescent's root, no separate cap
      // here) — the two screens share one editorial grid and left edge.
      // See docs/design_guidelines.md "Spacing & Layout".
      className="w-full animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]"
    >
      <div
        className="flex items-center justify-between gap-4 pb-2"
        style={{ borderBottom: `1px solid ${DIVIDER_COLOR}` }}
      >
        {/* Same document-identifier eyebrow as "Intake / Case 001" and
            "Clinical Note / Epicrisis 001" — the three intake/diagnosis/
            prescription screens read as consecutive pages of one case file. */}
        <span
          className="uppercase text-[11px] max-[640px]:text-[10.5px]"
          style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.04em', color: TEXT_TERTIARY }}
        >
          Prescription / Case 001
        </span>
        {onViewReceipt && (
          <button
            type="button"
            onClick={onViewReceipt}
            className="shrink-0 px-1 text-[10px] max-[480px]:min-h-[44px] max-[480px]:text-[11px] font-medium uppercase tracking-wide transition-colors duration-200"
            style={{ color: TEXT_SECONDARY }}
            onMouseEnter={(event) => (event.currentTarget.style.color = TREATMENT_ACCENT_TEXT)}
            onMouseLeave={(event) => (event.currentTarget.style.color = TEXT_SECONDARY)}
          >
            View receipt
          </button>
        )}
      </div>

      {/* Clinical metadata — monospace, not the sans body font used for
          the band names below. Per the typography split in
          docs/design_guidelines.md, monospace is reserved for clinical
          metadata; content (band names) reads in the app's normal sans. */}
      <div
        className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 mt-3 text-[11px] max-[480px]:text-[13px] uppercase"
        style={{ fontFamily: "'Courier New', monospace", letterSpacing: '0.04em' }}
      >
        <span style={{ color: TEXT_SECONDARY }}>For</span>
        <span style={{ color: TEXT_PRIMARY }}>{(triggerLabel || 'unknown').toUpperCase()}</span>

        {severityLabel && (
          <>
            <span style={{ color: TEXT_SECONDARY }}>Severity</span>
            <span style={{ color: TEXT_PRIMARY }}>{severityLabel}</span>
          </>
        )}

        {subgenre && (
          <>
            <span style={{ color: TEXT_SECONDARY }}>Treatment</span>
            <span style={{ color: TEXT_PRIMARY }}>{subgenre.toUpperCase()}</span>
          </>
        )}
      </div>

      <div className="mt-4" style={{ borderTop: `1px solid ${DIVIDER_COLOR}` }} />

      {/* The bands — a clean continuation of the landing page's own
          selection rows, not a receipt-strip. Numbers stay quiet (small,
          tertiary ink) so the band name — the actual payoff — carries the
          row. */}
      <div className="mt-1">
        {playlist.tracks.map((track, index) => (
          <div
            key={track.id}
            className="group flex items-center py-2.5 max-[480px]:py-0 max-[480px]:min-h-[48px]"
            style={{
              borderTop: index > 0 ? `1px solid ${DIVIDER_COLOR}` : 'none',
              animationDelay: `${index * 60}ms`,
            }}
          >
            {/* Indexing metadata, not information — quieter than the label
                row above it, so it recedes behind the band name. */}
            <span
              className="text-[9px] max-[480px]:text-[12px] tabular-nums shrink-0 w-6"
              style={{ fontFamily: "'Courier New', monospace", color: TEXT_TERTIARY, opacity: 0.6 }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              className="min-w-0 flex-1 truncate text-[14px] font-bold ml-1"
              style={{ color: TEXT_PRIMARY, fontFamily: 'var(--font-plex-sans), Arial, sans-serif' }}
            >
              {track.name}
            </span>
            {/* Outer <a> is the touch target — 44x44 minimum on mobile —
                while the visible circle stays small, centered inside it.
                Quiet until hover/focus (group-hover on the row, or the
                link's own :hover/:focus-visible) so every row doesn't end
                with a coral circle competing with the band name. */}
            <a
              href={track.bandcampUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center justify-center shrink-0 ml-2 w-5 h-5 max-[480px]:w-11 max-[480px]:h-11"
              title={`Search ${track.name} on Bandcamp`}
            >
              <span
                className="flex items-center justify-center w-5 h-5 rounded-full opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 hover:!opacity-100 transition-opacity duration-200"
                style={{ border: `1px solid ${TREATMENT_ACCENT_BORDER}`, color: TREATMENT_ACCENT_TEXT }}
              >
                <Radio className="h-2.5 w-2.5" />
              </span>
            </a>
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-[auto_1fr] gap-x-4 mt-2 pt-4 text-[11px] max-[480px]:text-[13px] uppercase"
        style={{ fontFamily: "'Courier New', monospace", letterSpacing: '0.04em', borderTop: `1px solid ${DIVIDER_COLOR}` }}
      >
        <span style={{ color: TEXT_SECONDARY }}>Dosage:</span>
        <span style={{ color: TEXT_PRIMARY }}>Take ten (10) bands. Repeat ad nauseam. No known cure.</span>
      </div>
    </div>
  );
}
