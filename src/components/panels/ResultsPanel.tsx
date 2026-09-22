'use client';

import { Music, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Circle, PANEL_BASE_CLASS, PANEL_SHADOW } from '@/lib/theme';
import { EmotionType, Playlist } from '@/types';
import CassetteLoader from '@/components/CassetteLoader';

interface ResultsPanelProps {
  playlist: Playlist | null;
  isProcessing: boolean;
  isAnalyzing: boolean;
  reasoning: string | null;
  emotion?: EmotionType | null;
  circle?: Circle | null;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
}

// Paper tone shared with ReceiptCard so the two feel like one physical
// artifact handed over together — a diagnosis and its prescription.
const PAPER_BG = '#e8e4d8';
const PAPER_INK = '#2a2a28';
const PAPER_MUTED = '#6b6b66';

export default function ResultsPanel({ playlist, isProcessing, isAnalyzing, reasoning, emotion, circle }: ResultsPanelProps) {
  if (!playlist) {
    return (
      <div className={cn(PANEL_BASE_CLASS, "h-full flex items-center justify-center")} style={PANEL_SHADOW}>
        <div className="text-center p-8 text-zinc-500">
          {isProcessing && !isAnalyzing && reasoning ? (
            <>
              <CassetteLoader className="mx-auto mb-4" />
              <h3 className="text-sm font-semibold mb-2 tracking-wide">Almost there</h3>
            </>
          ) : (
            <>
              <Music className="h-10 w-10 mx-auto mb-4 opacity-40 text-zinc-600" />
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide">Artists</h3>
              <p className="text-xs opacity-70">Complete analysis first</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      key={playlist.id}
      className="w-full max-w-sm rounded-sm animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]"
      style={{
        background: PAPER_BG,
        color: PAPER_INK,
        fontFamily: "'Courier New', monospace",
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Pad header — a prescription, not a database row */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div className="text-3xl font-bold leading-none" style={{ color: '#7f1d1d' }}>℞</div>
        <div className="text-right">
          <div className="text-sm font-bold tracking-wide">SONIC CATHARSIS</div>
          <div className="text-[8px] uppercase tracking-wide mt-0.5" style={{ color: PAPER_MUTED, letterSpacing: '1px' }}>
            Licensed Catharsis Practitioner
          </div>
        </div>
      </div>

      <div className="mx-5" style={{ borderTop: `1px dashed ${PAPER_INK}`, opacity: 0.4 }} />

      <div className="flex items-center justify-between px-5 py-2 text-[9px]">
        <span>PATIENT: {(emotion || 'unknown').toUpperCase()}</span>
        <span>DATE: {formatDate()}</span>
      </div>

      {circle && circle.index > 0 && (
        <div className="px-5 pb-2 text-[9px]">
          CONDITION: STAGE {circle.roman} — {circle.name.toUpperCase()}
        </div>
      )}

      <div className="mx-5" style={{ borderTop: `1px dashed ${PAPER_INK}`, opacity: 0.4 }} />

      <div className="px-5 py-3 text-[9px] uppercase" style={{ color: PAPER_MUTED, letterSpacing: '0.5px' }}>
        Sig: Take ten (10) bands. Repeat descent as needed. No known cure.
      </div>

      <div className="mx-5" style={{ borderTop: `1px dashed ${PAPER_INK}`, opacity: 0.4 }} />

      {/* The bands themselves, styled as line items on the pad */}
      <div className="px-5">
        {playlist.tracks.map((track, index) => (
          <div
            key={track.id}
            className="flex items-center py-2.5"
            style={{
              borderTop: index > 0 ? `1px dotted ${PAPER_INK}` : 'none',
              borderTopColor: index > 0 ? `${PAPER_INK}33` : undefined,
              animationDelay: `${index * 60}ms`,
            }}
          >
            <span className="text-[10px] tabular-nums shrink-0 w-5" style={{ color: PAPER_MUTED }}>
              {index + 1}.
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold ml-1">{track.name}</span>
            <a
              href={track.bandcampUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 ml-2"
              title="Listen on Bandcamp"
              style={{ border: `1px solid #7f1d1d80`, color: '#7f1d1d' }}
            >
              <Radio className="h-2.5 w-2.5" />
            </a>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-2" style={{ borderTop: `1px dashed ${PAPER_INK}`, opacity: 0.4 }} />

      {/* Signature */}
      <div className="px-5 py-4 text-right">
        <div className="text-lg italic" style={{ fontFamily: "'Brush Script MT', cursive", color: PAPER_INK }}>
          Dr. Catharsis
        </div>
        <div className="text-[8px] uppercase tracking-wide" style={{ color: PAPER_MUTED, letterSpacing: '1px' }}>
          M.D. (Metal Doctor) — refills: ∞
        </div>
      </div>
    </div>
  );
}
