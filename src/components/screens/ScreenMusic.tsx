'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MUSIC_GENRES, type MusicGenreId } from '@/lib/music-prep';
import { ReferenceArtistSchema } from '@/lib/validation';
import { EASE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, DIVIDER_COLOR } from '@/lib/theme';

interface ScreenMusicProps {
  // Picking a genre starts the scene at once, so the optional artist is
  // sent along with it.
  onPick: (genre: MusicGenreId, referenceArtist?: string) => void;
  onBack: () => void;
}

const EYEBROW_STYLE = { fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.04em', color: TEXT_TERTIARY } as const;
const BODY_FONT = { fontFamily: 'var(--font-plex-sans), Arial, sans-serif' } as const;

// "Prepare me for the music" step 1: the genre picker. Tapping a genre is the
// whole interaction: Seppo is already mid-rant on the next screen.
export default function ScreenMusic({ onPick, onBack }: ScreenMusicProps) {
  const [artist, setArtist] = useState('');
  const trimmed = artist.trim();
  const artistValid = trimmed === '' || ReferenceArtistSchema.safeParse(trimmed).success;

  return (
    <div className="flex flex-col max-w-2xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      <span className="uppercase text-[13px] max-[640px]:text-[14px]" style={EYEBROW_STYLE}>
        Referral / 05 — Music Preparation
      </span>
      <h2 className="m-0 mt-3 text-[22px] max-[640px]:text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>
        What are we listening to? Seppo will make it appropriate.
      </h2>

      <label className="mt-6 block text-[14px]" htmlFor="reference-artist" style={{ ...BODY_FONT, color: TEXT_SECONDARY }}>
        A band to aim for <span style={{ color: TEXT_TERTIARY }}>(optional, fill in before choosing)</span>
      </label>
      <input
        id="reference-artist"
        type="text"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        maxLength={60}
        autoComplete="off"
        aria-invalid={!artistValid}
        className="mt-1.5 w-full px-3 py-2.5 text-[15px] max-[640px]:text-[16px] rounded-lg"
        style={{ ...BODY_FONT, color: TEXT_PRIMARY, background: '#fbfaf6', border: `1px solid ${DIVIDER_COLOR}` }}
      />
      {!artistValid && (
        <p className="m-0 mt-1.5 text-[13px]" role="alert" style={{ color: '#a3493a' }}>
          Band names only, please: letters, numbers and basic punctuation.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2.5" role="group" aria-label="Genre">
        {MUSIC_GENRES.map((g) => (
          <button
            key={g.id}
            type="button"
            disabled={!artistValid}
            onClick={() => onPick(g.id, trimmed || undefined)}
            className="w-full text-left px-4 py-3.5 rounded-lg active:scale-[0.99] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: '#f2efe7', border: '1px solid #e6e2d8', transition: `all 0.2s ${EASE}` }}
          >
            <span className="block text-[16px] font-semibold" style={{ ...BODY_FONT, color: TEXT_PRIMARY }}>{g.label}</span>
            <span className="block text-[13px] mt-0.5" style={{ ...BODY_FONT, color: TEXT_SECONDARY }}>{g.persona}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[13px] font-medium uppercase tracking-wide hover:text-[#3f3b33]!"
          style={{ letterSpacing: '0.05em', color: TEXT_SECONDARY }}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to intake
        </button>
      </div>
    </div>
  );
}
