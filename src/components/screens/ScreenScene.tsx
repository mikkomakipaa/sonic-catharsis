'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { VittuiluMessage } from '@/lib/validation';
import { MAX_SCENE_USER_MESSAGES, MAX_SCENE_USER_TEXT } from '@/lib/validation';
import type { MusicGenreId } from '@/lib/music-prep';
import type { z } from 'zod';
import type { SonicProfileSchema } from '@/lib/validation';

// What the opening decides about the prescription: the model's own pick.
export interface SceneSound {
  genre: MusicGenreId;
  subgenre: string;
  sonic_profile: z.infer<typeof SonicProfileSchema>;
}
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
  // The patient's answer to "What is your favorite music genre?".
  favorite: string;
  // "Ready for the soundtrack": hand off to the prescription with the metal
  // part Seppo picked and, when there is one, his one-line file note on the
  // scene so far.
  onReady: (sound: SceneSound, sceneSummary?: string) => void;
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

// "Prepare me for the music" step 2: the scene. On mount Seppo's opening is
// requested (empty transcript): he mocks the favorite genre and the model picks
// the metal part, which is then sent back with every later turn. The full
// transcript, opening included, is resent each time (the route is stateless).
export default function ScreenScene({ favorite, onReady, onBack }: ScreenSceneProps) {
  const [sound, setSound] = useState<SceneSound | null>(null);
  const genre = sound?.genre ?? null;
  const [isOpening, setIsOpening] = useState(true);
  const [attempt, setAttempt] = useState(0);
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
  const canSend = !isOpening && !isSending && !ended && draft.trim().length > 0;

  // One call to /api/scene. `next` is the full transcript to send.
  const requestReply = async (next: VittuiluMessage[], currentGenre: MusicGenreId | null) => {
    const res = await fetch('/api/scene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite, ...(currentGenre ? { genre: currentGenre } : {}), messages: next }),
    });
    const data = await res.json();
    if (!res.ok || data.error || typeof data.reply !== 'string') throw new Error(data.error || 'Seppo is unavailable');
    return data as { reply: string; end_scene?: boolean; genre?: MusicGenreId; subgenre?: string; sonic_profile?: SceneSound['sonic_profile']; scene_summary?: string };
  };

  // Seppo's opening: requested on mount and again on each retry (`attempt`).
  // The screen is remounted by the parent for a new answer.
  useEffect(() => {
    let cancelled = false;
    requestReply([], null)
      .then((data) => {
        if (cancelled) return;
        if (!data.genre || !data.subgenre || !data.sonic_profile) throw new Error('Seppo is unavailable');
        setSound({ genre: data.genre, subgenre: data.subgenre, sonic_profile: data.sonic_profile });
        setMessages([{ role: 'seppo', text: data.reply }]);
        if (typeof data.scene_summary === 'string') setSummary(data.scene_summary);
        setIsOpening(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Seppo is unavailable');
        setIsOpening(false);
      });
    return () => {
      cancelled = true;
    };
    // requestReply only closes over `favorite`, which is fixed per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const send = async () => {
    if (!canSend || !genre) return;
    const text = draft.trim();
    const next: VittuiluMessage[] = [...messages, { role: 'user', text }];
    setMessages(next);
    setDraft('');
    setError(null);
    setIsSending(true);
    try {
      const data = await requestReply(next, genre);
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
      onClick={() => sound && onReady(sound, summary)}
      disabled={isOpening || isSending || !sound}
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
        Referral / 05 — Music Preparation
      </span>

      <div
        className="mt-4 flex flex-col gap-3 p-4 max-[640px]:p-3 rounded-lg"
        style={{ border: `1px solid ${DIVIDER_COLOR}`, minHeight: 200 }}
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>{m.text}</Bubble>
        ))}
        {(isOpening || isSending) && (
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
        <div className="mt-3 flex items-center gap-3">
          <p className="m-0 text-[13px]" style={{ color: TREATMENT_ACCENT_TEXT }} role="alert">{error}</p>
          {!genre && !isOpening && (
            <button type="button" onClick={() => {
                setError(null);
                setIsOpening(true);
                setAttempt((n) => n + 1);
              }} className="text-[13px] font-medium uppercase underline" style={{ color: TEXT_SECONDARY }}>
              Try again
            </button>
          )}
        </div>
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
            disabled={isOpening || isSending}
            placeholder="Answer Seppo…"
            aria-label="Reply to Seppo"
            className="w-full px-3 py-2.5 text-[15px] max-[640px]:text-[16px] rounded-lg resize-none"
            style={{ ...BODY_FONT, color: TEXT_PRIMARY, background: '#fbfaf6', border: `1px solid ${DIVIDER_COLOR}` }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
              {userCount} / {MAX_SCENE_USER_MESSAGES} {MAX_SCENE_USER_MESSAGES === 1 ? 'reply' : 'replies'} · {draft.length} / {MAX_SCENE_USER_TEXT}
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
          Change answer
        </button>
      </div>
    </div>
  );
}
