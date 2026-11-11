'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { VittuiluMessage } from '@/lib/validation';
import { MAX_SCENE_USER_MESSAGES, MAX_SCENE_USER_TEXT } from '@/lib/validation';
import { getMusicGenre, type MusicGenreId } from '@/lib/music-prep';
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

interface ScreenSceneProps {
  genre: MusicGenreId;
  referenceArtist?: string;
  // "Ready for the soundtrack": hand off to the prescription. The summary is
  // Seppo's one-line file note on the scene so far, when there is one; there
  // is none if the patient leaves before replying.
  onReady: (sceneSummary?: string) => void;
  onBack: () => void;
}

const EYEBROW_STYLE = { fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.04em', color: TEXT_TERTIARY } as const;
const BODY_FONT = { fontFamily: 'var(--font-plex-sans), Arial, sans-serif' } as const;

function Bubble({ role, children }: { role: VittuiluMessage['role']; children: React.ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-[rite-reveal_0.3s_cubic-bezier(0.25,1,0.5,1)_both]`}>
      <div className="max-w-[85%]">
        <span className="block uppercase text-[14px] mb-1" style={{ ...EYEBROW_STYLE, textAlign: isUser ? 'right' : 'left' }}>
          {isUser ? 'You' : 'Seppo'}
        </span>
        <p
          className="m-0 px-3.5 py-2.5 text-[15px] max-[640px]:text-[16px] leading-[1.45] rounded-lg whitespace-pre-wrap break-words"
          style={{
            ...BODY_FONT,
            color: isUser ? TREATMENT_ACCENT_TEXT : TEXT_PRIMARY,
            background: isUser ? TREATMENT_ACCENT_BG : '#f2efe7',
            border: `1px solid ${isUser ? TREATMENT_ACCENT_BORDER : DIVIDER_COLOR}`,
          }}
        >
          {children}
        </p>
      </div>
    </div>
  );
}

// "Prepare me for the music" step 2: the scene. Seppo's hand-written opening
// is on screen from the first render (no typing beat, no model call). The
// transcript sent to /api/scene excludes it; the server prepends it.
export default function ScreenScene({ genre, referenceArtist, onReady, onBack }: ScreenSceneProps) {
  const meta = getMusicGenre(genre);
  const [messages, setMessages] = useState<VittuiluMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [ended, setEnded] = useState(false);
  const [summary, setSummary] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const userCount = messages.filter((m) => m.role === 'user').length;
  const canSend = !isSending && !ended && draft.trim().length > 0;

  const send = async () => {
    if (!canSend) return;
    const text = draft.trim();
    const next: VittuiluMessage[] = [...messages, { role: 'user', text }];
    setMessages(next);
    setDraft('');
    setError(null);
    setIsSending(true);
    try {
      const res = await fetch('/api/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, ...(referenceArtist ? { referenceArtist } : {}), messages: next }),
      });
      const data = await res.json();
      if (!res.ok || data.error || typeof data.reply !== 'string') throw new Error(data.error || 'Seppo is unavailable');
      setMessages([...next, { role: 'seppo', text: data.reply }]);
      if (data.end_scene) setEnded(true);
      if (typeof data.scene_summary === 'string') setSummary(data.scene_summary);
    } catch (e) {
      // Roll the failed turn back so the patient can resend it unchanged.
      setMessages(messages);
      setDraft(text);
      setError(e instanceof Error ? e.message : 'Seppo is unavailable');
    } finally {
      setIsSending(false);
    }
  };

  const readyButton = (
    <button
      type="button"
      onClick={() => onReady(summary)}
      disabled={isSending}
      className="w-full max-w-[280px] py-3.5 font-semibold text-sm uppercase rounded-lg active:scale-[0.98] disabled:opacity-50"
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
      Ready for the soundtrack
    </button>
  );

  return (
    <div className="flex flex-col max-w-2xl mx-auto animate-[rite-reveal_0.4s_cubic-bezier(0.25,1,0.5,1)_both]">
      <span className="uppercase text-[13px] max-[640px]:text-[14px]" style={EYEBROW_STYLE}>
        Referral / 05 — {meta.label}
      </span>

      <div
        className="mt-4 flex flex-col gap-3 p-4 max-[640px]:p-3 rounded-lg"
        style={{ border: `1px solid ${DIVIDER_COLOR}`, minHeight: 200 }}
        aria-live="polite"
      >
        <Bubble role="seppo">{meta.opening}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>{m.text}</Bubble>
        ))}
        {isSending && (
          <div className="flex justify-start" role="status" aria-label="Seppo is typing">
            <p className="m-0 px-3.5 py-2.5 text-[13px] rounded-lg" style={{ ...BODY_FONT, color: TEXT_TERTIARY, background: '#f2efe7', border: `1px solid ${DIVIDER_COLOR}` }}>
              Seppo is typing…
            </p>
          </div>
        )}
        {ended && (
          <p className="m-0 text-center text-[14px] uppercase" style={EYEBROW_STYLE}>Seppo has left the building</p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="m-0 mt-3 text-[13px]" style={{ color: TREATMENT_ACCENT_TEXT }} role="alert">{error}</p>
      )}

      {!ended && (
        <form
          className="mt-4 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            maxLength={MAX_SCENE_USER_TEXT}
            rows={2}
            disabled={isSending}
            placeholder="Answer Seppo…"
            aria-label="Reply to Seppo"
            className="w-full px-3 py-2.5 text-[15px] max-[640px]:text-[16px] rounded-lg resize-none"
            style={{ ...BODY_FONT, color: TEXT_PRIMARY, background: '#fbfaf6', border: `1px solid ${DIVIDER_COLOR}` }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
              {userCount} / {MAX_SCENE_USER_MESSAGES} replies · {draft.length} / {MAX_SCENE_USER_TEXT}
            </span>
            <button
              type="submit"
              disabled={!canSend}
              className="px-5 py-2.5 font-semibold text-[13px] uppercase rounded-lg active:scale-[0.98] disabled:opacity-50"
              style={{
                transition: `all 0.2s ${EASE}`,
                letterSpacing: '0.08em',
                background: '#f2efe7',
                color: TEXT_SECONDARY,
                border: '1px solid #e6e2d8',
              }}
            >
              Send
            </button>
          </div>
        </form>
      )}

      {/* Always available from the first screen: the scene ends whenever the patient says. */}
      <div className="flex flex-col items-center gap-4 mt-6">
        {readyButton}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[13px] font-medium uppercase tracking-wide hover:text-[#3f3b33]!"
          style={{ letterSpacing: '0.05em', color: TEXT_SECONDARY }}
        >
          <ArrowLeft className="h-3 w-3" />
          Change genre
        </button>
      </div>
    </div>
  );
}
