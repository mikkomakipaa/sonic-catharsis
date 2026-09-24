'use client';

import { Music, Radio } from 'lucide-react';
import {
  Stage,
  SECTION_LABEL_STYLE,
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
}

export default function ResultsPanel({ playlist, isProcessing, isAnalyzing, reasoning, triggerLabel, stage, subgenre }: ResultsPanelProps) {
  if (!playlist) {
    // No background/border box around the loading state itself — see
    // docs/design_guidelines.md → Loading States. PrescriptionCalibration
    // uses document typography (like DiagnosticReceipt on the matcher
    // stage) but is still not wrapped in a card.
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
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

  const severityLabel = stage && stage.index > 0 ? `${stage.roman} · ${stage.name.toUpperCase()}` : null;

  return (
    <div
      key={playlist.id}
      // No card/paper background — sits directly on the page, same as the
      // Diagnosis screen. See docs/design_guidelines.md "Design Philosophy".
      className="w-full max-w-xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]"
    >
      <div
        className="uppercase font-bold text-[17px] max-[480px]:text-[19px] pb-3"
        style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.06em', color: TEXT_PRIMARY, borderBottom: `1px solid ${DIVIDER_COLOR}` }}
      >
        Prescription
      </div>

      {/* Clinical metadata — monospace, not the sans body font used for
          the band names below. Per the typography split in
          docs/design_guidelines.md, monospace is reserved for clinical
          metadata; content (band names) reads in the app's normal sans. */}
      <div
        className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 mt-4 text-[11px] max-[480px]:text-[13px] uppercase"
        style={{ fontFamily: "'Courier New', monospace", letterSpacing: '0.04em' }}
      >
        <span style={{ color: TEXT_TERTIARY }}>For</span>
        <span style={{ color: TEXT_PRIMARY }}>{(triggerLabel || 'unknown').toUpperCase()}</span>

        {severityLabel && (
          <>
            <span style={{ color: TEXT_TERTIARY }}>Severity</span>
            <span style={{ color: stage!.color }}>{severityLabel}</span>
          </>
        )}

        {subgenre && (
          <>
            <span style={{ color: TEXT_TERTIARY }}>Treatment</span>
            <span style={{ color: TREATMENT_ACCENT_TEXT }}>{subgenre.toUpperCase()}</span>
          </>
        )}
      </div>

      <div className="mt-4" style={{ borderTop: `1px solid ${DIVIDER_COLOR}` }} />

      {/* The bands — a clean continuation of the landing page's own
          selection rows, not a receipt-strip. */}
      <div className="mt-1">
        {playlist.tracks.map((track, index) => (
          <div
            key={track.id}
            className="flex items-center py-2.5 max-[480px]:py-0 max-[480px]:min-h-[64px]"
            style={{
              borderTop: index > 0 ? `1px solid ${DIVIDER_COLOR}` : 'none',
              animationDelay: `${index * 60}ms`,
            }}
          >
            <span
              className="text-[10px] max-[480px]:text-[13px] tabular-nums shrink-0 w-6"
              style={{ fontFamily: "'Courier New', monospace", color: TEXT_TERTIARY }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              className="min-w-0 flex-1 truncate text-[13px] max-[480px]:text-[16px] font-bold ml-1"
              style={{ color: TEXT_PRIMARY, fontFamily: 'var(--font-plex-sans), Arial, sans-serif' }}
            >
              {track.name}
            </span>
            {/* Outer <a> is the touch target — 44x44 minimum on mobile —
                while the visible circle stays small, centered inside it. */}
            <a
              href={track.bandcampUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center justify-center shrink-0 ml-2 w-5 h-5 max-[480px]:w-11 max-[480px]:h-11"
              title="Listen on Bandcamp"
            >
              <span
                className="flex items-center justify-center w-5 h-5 rounded-full"
                style={{ border: `1px solid ${TREATMENT_ACCENT_BORDER}`, color: TREATMENT_ACCENT_TEXT }}
              >
                <Radio className="h-2.5 w-2.5" />
              </span>
            </a>
          </div>
        ))}
      </div>

      <div className="mt-2 pt-4" style={{ borderTop: `1px solid ${DIVIDER_COLOR}` }}>
        <span style={{ ...SECTION_LABEL_STYLE, textAlign: 'left' }}>Dosage</span>
        <p
          className="uppercase mt-2 text-[10px] max-[480px]:text-[12px] leading-[1.6]"
          style={{ fontFamily: "'Courier New', monospace", letterSpacing: '0.03em', color: TEXT_SECONDARY }}
        >
          Take ten (10) bands. Repeat ad nauseam. No known cure.
        </p>
      </div>
    </div>
  );
}
