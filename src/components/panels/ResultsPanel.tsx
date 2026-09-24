'use client';

import { Music, Radio } from 'lucide-react';
import { Stage } from '@/lib/theme';
import { Playlist } from '@/types';
import CassetteLoader from '@/components/CassetteLoader';

interface ResultsPanelProps {
  playlist: Playlist | null;
  isProcessing: boolean;
  isAnalyzing: boolean;
  reasoning: string | null;
  triggerLabel?: string | null;
  stage?: Stage | null;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
}

// Paper tone shared with ReceiptCard so the two feel like one physical
// artifact handed over together — a diagnosis and its prescription.
const PAPER_BG = '#e8e4d8';
const PAPER_INK = '#2a2a28';

export default function ResultsPanel({ playlist, isProcessing, isAnalyzing, reasoning, triggerLabel, stage }: ResultsPanelProps) {
  if (!playlist) {
    // No background/border box — matches the analysis screen's own loading
    // state (ScreenAnalysis.tsx), which is plain, so a loading state never
    // looks like two different treatments depending on which screen it's
    // on. See docs/design_guidelines.md → Loading States.
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          {isProcessing && !isAnalyzing && reasoning ? (
            <>
              <CassetteLoader className="mx-auto mb-6" label="INEARTHED" />
              <h3 className="text-sm font-semibold mb-2 tracking-wide" style={{ color: '#2f2e2b' }}>Almost there</h3>
            </>
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

  return (
    <div
      key={playlist.id}
      // Wider cap on mobile (~440px, this is the payoff of the whole
      // interaction and should dominate the screen there) than on desktop
      // (max-w-sm/384px, where it sits side-by-side with the receipt and
      // shouldn't balloon past a reasonable document width).
      className="w-full max-w-[440px] sm:max-w-sm rounded-sm animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]"
      style={{
        background: PAPER_BG,
        color: PAPER_INK,
        fontFamily: "'Courier New', monospace",
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Pad header — a prescription, not a database row. Rx stays pinned
          to its corner (absolutely positioned so it doesn't skew the
          centering) while the title centers across the full card width. */}
      <div className="relative text-center px-5 max-[480px]:px-6 pt-5 pb-3">
        <div className="absolute left-5 max-[480px]:left-6 top-5 text-3xl font-bold leading-none" style={{ color: '#7f1d1d' }}>℞</div>
        <div className="text-sm max-[480px]:text-base font-bold tracking-wide uppercase">Prescription</div>
      </div>

      <div className="mx-5 max-[480px]:mx-6" style={{ borderTop: `1px dashed ${PAPER_INK}`, opacity: 0.4 }} />

      <div className="flex items-center justify-between px-5 max-[480px]:px-6 py-2 text-[9px] max-[480px]:text-[13px]">
        <span>PATIENT: {(triggerLabel || 'unknown').toUpperCase()}</span>
        <span>DATE: {formatDate()}</span>
      </div>

      {stage && stage.index > 0 && (
        <div className="px-5 max-[480px]:px-6 pb-2 text-[9px] max-[480px]:text-[13px]">
          CONDITION: STAGE {stage.roman} — {stage.name.toUpperCase()}
        </div>
      )}

      <div className="mx-5 max-[480px]:mx-6" style={{ borderTop: `1px dashed ${PAPER_INK}`, opacity: 0.4 }} />

      <div
        className="px-5 max-[480px]:px-6 py-3 text-[9px] max-[480px]:text-[13px] uppercase text-[#6b6b66] max-[480px]:text-[#4a4a46]"
        style={{ letterSpacing: '0.5px' }}
      >
        Sig: Take ten (10) bands. Repeat ad nauseam. No known cure.
      </div>

      <div className="mx-5 max-[480px]:mx-6" style={{ borderTop: `1px dashed ${PAPER_INK}`, opacity: 0.4 }} />

      {/* The bands themselves, styled as line items on the pad */}
      <div className="px-5 max-[480px]:px-6">
        {playlist.tracks.map((track, index) => (
          <div
            key={track.id}
            className="flex items-center py-2.5 max-[480px]:py-0 max-[480px]:min-h-[64px]"
            style={{
              borderTop: index > 0 ? `1px dotted ${PAPER_INK}` : 'none',
              borderTopColor: index > 0 ? `${PAPER_INK}33` : undefined,
              animationDelay: `${index * 60}ms`,
            }}
          >
            <span className="text-[10px] max-[480px]:text-[13px] tabular-nums shrink-0 w-5 text-[#6b6b66] max-[480px]:text-[#4a4a46]">
              {index + 1}.
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] max-[480px]:text-[16px] font-bold ml-1">{track.name}</span>
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
                style={{ border: `1px solid #7f1d1d80`, color: '#7f1d1d' }}
              >
                <Radio className="h-2.5 w-2.5" />
              </span>
            </a>
          </div>
        ))}
      </div>

      <div className="mx-5 max-[480px]:mx-6 mt-2" style={{ borderTop: `1px dashed ${PAPER_INK}`, opacity: 0.4 }} />

      {/* Signature */}
      <div className="px-5 max-[480px]:px-6 py-4 text-right">
        <div className="text-lg italic" style={{ fontFamily: "'Brush Script MT', cursive", color: PAPER_INK }}>
          Dr. Catharsis
        </div>
        <div
          className="text-[8px] max-[480px]:text-[11px] uppercase tracking-wide text-[#6b6b66] max-[480px]:text-[#4a4a46]"
          style={{ letterSpacing: '1px' }}
        >
          M.D. (Metal Doctor)
        </div>
      </div>
    </div>
  );
}
