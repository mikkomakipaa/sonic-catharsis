'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { FavoriteGenreSchema } from '@/lib/validation';
import {
  EASE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  DIVIDER_COLOR,
  TREATMENT_ACCENT_BG,
  TREATMENT_ACCENT_BG_HOVER,
  TREATMENT_ACCENT_BORDER,
  TREATMENT_ACCENT_TEXT,
} from '@/lib/theme';

interface ScreenMusicProps {
  // Submitting the answer starts the scene.
  onSubmit: (favorite: string) => void;
  onBack: () => void;
  initial?: string;
}

const EYEBROW_STYLE = { fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.04em', color: TEXT_TERTIARY } as const;
const BODY_FONT = { fontFamily: 'var(--font-plex-sans), Arial, sans-serif' } as const;

// "Prepare me for the music" step 1: one question. The answer is Seppo's
// material for the scene that follows.
export default function ScreenMusic({ onSubmit, onBack, initial = '' }: ScreenMusicProps) {
  const [answer, setAnswer] = useState(initial);
  const trimmed = answer.trim();
  const valid = FavoriteGenreSchema.safeParse(trimmed).success;
  const showError = trimmed !== '' && !valid;

  return (
    <div className="flex flex-col max-w-2xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      <span className="uppercase text-[13px] max-[640px]:text-[14px]" style={EYEBROW_STYLE}>
        Referral / 05 — Music Preparation
      </span>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(trimmed);
        }}
      >
        <label htmlFor="favorite-genre" className="block mt-3 text-[22px] max-[640px]:text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>
          What is your favorite music genre?
        </label>
        <input
          id="favorite-genre"
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          maxLength={60}
          autoComplete="off"
          autoFocus
          aria-invalid={showError}
          className="mt-4 w-full px-3 py-2.5 text-[15px] max-[640px]:text-[16px] rounded-lg"
          style={{ ...BODY_FONT, color: TEXT_PRIMARY, background: '#fbfaf6', border: `1px solid ${DIVIDER_COLOR}` }}
        />
        {showError && (
          <p className="m-0 mt-1.5 text-[13px]" role="alert" style={{ color: '#a3493a' }}>
            Just the genre, please: letters, numbers and basic punctuation.
          </p>
        )}
        <div className="mt-5 flex justify-center">
          <button
            type="submit"
            disabled={!valid}
            className="w-full max-w-[280px] py-3.5 font-semibold text-sm uppercase rounded-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              transition: `all 0.2s ${EASE}`,
              letterSpacing: '0.08em',
              background: TREATMENT_ACCENT_BG,
              color: TREATMENT_ACCENT_TEXT,
              border: `1px solid ${TREATMENT_ACCENT_BORDER}`,
            }}
            onMouseEnter={(e) => valid && (e.currentTarget.style.background = TREATMENT_ACCENT_BG_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = TREATMENT_ACCENT_BG)}
          >
            Answer
          </button>
        </div>
      </form>

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
