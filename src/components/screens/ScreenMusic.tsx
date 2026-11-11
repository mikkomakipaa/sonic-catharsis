'use client';

import { useState } from 'react';
import { ArrowDownToLine, ArrowLeft } from 'lucide-react';
import { FavoriteGenreSchema } from '@/lib/validation';
import {
  CTA_BACKGROUND,
  CTA_SHADOW,
  CTA_TEXT_COLOR,
  CTA_TEXT_SHADOW,
  DIVIDER_COLOR,
  EASE,
  SECTION_LABEL_STYLE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ScreenMusicProps {
  // Submitting the answer starts the scene.
  onSubmit: (favorite: string) => void;
  onBack: () => void;
  initial?: string;
}

// "Prepare me for the music" step 1: one question. The answer is Seppo's
// material for the scene that follows. Built from the intake screen's own
// pieces (StateOfMindPanel): the document eyebrow, the centered section
// label, the bordered field that only changes border color on focus, and the
// shared CTA button.
export default function ScreenMusic({ onSubmit, onBack, initial = '' }: ScreenMusicProps) {
  const [answer, setAnswer] = useState(initial);
  const [isFocused, setIsFocused] = useState(false);
  const trimmed = answer.trim();
  const valid = FavoriteGenreSchema.safeParse(trimmed).success;
  const showError = trimmed !== '' && !valid;

  return (
    <div className="max-w-3xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <span
            className="uppercase text-[13px] max-[640px]:text-[14px]"
            style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.04em', color: TEXT_TERTIARY }}
          >
            Referral / 05 — Music Preparation
          </span>
        </div>

        <form
          className="w-full max-w-2xl mt-6 max-[480px]:mt-5 flex flex-col items-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onSubmit(trimmed);
          }}
        >
          <label htmlFor="favorite-genre" className="mb-2 text-center uppercase max-[640px]:!text-[15px]" style={SECTION_LABEL_STYLE}>
            What is your favorite music genre?
          </label>
          <input
            id="favorite-genre"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={60}
            autoComplete="off"
            autoFocus
            aria-invalid={showError}
            aria-describedby={showError ? 'favorite-genre-error' : undefined}
            placeholder="Be honest."
            className="w-full h-12 px-3 text-sm max-[640px]:text-[16px] text-center focus:outline-none font-normal rounded-md placeholder-[#5c584f] placeholder:font-light focus:placeholder:opacity-0"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              color: TEXT_PRIMARY,
              border: `1px solid ${isFocused ? '#c99184' : DIVIDER_COLOR}`,
              transition: `border-color 0.2s ${EASE}`,
            }}
          />
          {showError && (
            <p id="favorite-genre-error" className="text-center mt-2 text-[13px] max-[640px]:text-[14px]" role="alert" style={{ color: TEXT_SECONDARY }}>
              Just the genre, please: letters, numbers and basic punctuation.
            </p>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={!valid}
              className={cn(
                'px-10 py-4 font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 rounded-lg active:scale-[0.98]',
                valid ? 'hover:brightness-125' : 'cursor-not-allowed opacity-50'
              )}
              style={{
                transition: `all 0.2s ${EASE}`,
                letterSpacing: '0.08em',
                background: valid ? CTA_BACKGROUND : '#f2efe7',
                color: valid ? CTA_TEXT_COLOR : '#47433b',
                border: valid ? 'none' : '1px solid #e6e2d8',
                boxShadow: valid ? CTA_SHADOW : 'none',
                textShadow: valid ? CTA_TEXT_SHADOW : undefined,
              }}
            >
              <ArrowDownToLine className="h-4 w-4" />
              <span>Answer</span>
            </button>
          </div>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="mt-8 flex items-center gap-1 text-[13px] font-medium uppercase tracking-wide"
          style={{ letterSpacing: '0.05em', color: '#47433b', transition: `color 0.2s ${EASE}` }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3b33')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#47433b')}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to intake
        </button>
      </div>
    </div>
  );
}
