'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { VittuiluMessage } from '@/lib/validation';
import { MAX_VITTUILU_USER_MESSAGES, MAX_VITTUILU_USER_TEXT } from '@/lib/validation';
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

interface ScreenVittuiluProps {
  // "Nyt vituttaa?" after the chat: re-assess, pre-filled from the chat.
  onConfirm: () => void;
  onBack: () => void;
  onReset: () => void;
}

// Hardcoded opener: costs no model call, and the contrast with Seppo's first
// real reply is the joke. Not part of the transcript sent to /api/vittuilu.
const GREETING = 'Vitutuspalvelu, Seppo online. Miten voin auttaa?';
const GREETING_DELAY_MS = 1100;

const EYEBROW_STYLE = {
  fontFamily: 'var(--font-special-elite), monospace',
  letterSpacing: '0.04em',
  color: TEXT_TERTIARY,
} as const;

const BODY_FONT = { fontFamily: 'var(--font-plex-sans), Arial, sans-serif' } as const;

const SECONDARY_BUTTON_STYLE = {
  letterSpacing: '0.05em',
  color: TEXT_SECONDARY,
  background: '#f2efe7',
  border: '1px solid #e6e2d8',
  transition: `all 0.2s ${EASE}`,
} as const;

function Bubble({ role, children }: { role: VittuiluMessage['role']; children: React.ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-[rite-reveal_0.3s_cubic-bezier(0.25,1,0.5,1)_both]`}>
      <div className="max-w-[85%]">
        <span className="block uppercase text-[10px] mb-1" style={{ ...EYEBROW_STYLE, textAlign: isUser ? 'right' : 'left' }}>
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

function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Seppo is typing">
      <p className="m-0 px-3.5 py-2.5 text-[13px] rounded-lg" style={{ ...BODY_FONT, color: TEXT_TERTIARY, background: '#f2efe7', border: `1px solid ${DIVIDER_COLOR}` }}>
        Seppo is typing…
      </p>
    </div>
  );
}

export default function ScreenVittuilu({ onConfirm, onBack, onReset }: ScreenVittuiluProps) {
  const [greeted, setGreeted] = useState(false);
  const [messages, setMessages] = useState<VittuiluMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setGreeted(true), GREETING_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending, greeted]);

  const userCount = messages.filter((m) => m.role === 'user').length;
  const canSend = greeted && !isSending && !ended && draft.trim().length > 0;

  const send = async () => {
    if (!canSend) return;
    const text = draft.trim();
    const next: VittuiluMessage[] = [...messages, { role: 'user', text }];
    setMessages(next);
    setDraft('');
    setError(null);
    setIsSending(true);

    try {
      const res = await fetch('/api/vittuilu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok || data.error || typeof data.reply !== 'string') {
        throw new Error(data.error || 'Seppo is unavailable');
      }
      setMessages([...next, { role: 'seppo', text: data.reply }]);
      if (data.end_chat) setEnded(true);
    } catch (e) {
      // Roll the failed turn back so the user can resend it unchanged.
      setMessages(messages);
      setDraft(text);
      setError(e instanceof Error ? e.message : 'Seppo is unavailable');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      <span className="uppercase text-[11px] max-[640px]:text-[10.5px]" style={EYEBROW_STYLE}>
        Referral / 04 — Vitutuspalvelu Live Chat
      </span>

      <div
        className="mt-4 flex flex-col gap-3 p-4 max-[640px]:p-3 rounded-lg"
        style={{ border: `1px solid ${DIVIDER_COLOR}`, minHeight: 240 }}
        aria-live="polite"
      >
        {greeted ? <Bubble role="seppo">{GREETING}</Bubble> : <TypingIndicator />}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.text}
          </Bubble>
        ))}
        {isSending && <TypingIndicator />}
        {ended && (
          <p className="m-0 text-center text-[12px] uppercase" style={EYEBROW_STYLE}>
            Seppo has left the chat
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="m-0 mt-3 text-[13px]" style={{ color: TREATMENT_ACCENT_TEXT }} role="alert">
          {error}
        </p>
      )}

      {!ended ? (
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
            maxLength={MAX_VITTUILU_USER_TEXT}
            rows={2}
            disabled={!greeted || isSending}
            placeholder="Write to Seppo…"
            aria-label="Message to Seppo"
            className="w-full px-3 py-2.5 text-[15px] max-[640px]:text-[16px] rounded-lg resize-none"
            style={{ ...BODY_FONT, color: TEXT_PRIMARY, background: '#fbfaf6', border: `1px solid ${DIVIDER_COLOR}` }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: TEXT_SECONDARY }}>
              {userCount} / {MAX_VITTUILU_USER_MESSAGES} messages · {draft.length} / {MAX_VITTUILU_USER_TEXT}
            </span>
            <button
              type="submit"
              disabled={!canSend}
              className="px-5 py-2.5 font-semibold text-xs uppercase rounded-lg active:scale-[0.98] disabled:opacity-50"
              style={{
                transition: `all 0.2s ${EASE}`,
                letterSpacing: '0.08em',
                background: TREATMENT_ACCENT_BG,
                color: TREATMENT_ACCENT_TEXT,
                border: `1px solid ${TREATMENT_ACCENT_BORDER}`,
              }}
              onMouseEnter={(e) => canSend && (e.currentTarget.style.background = TREATMENT_ACCENT_BG_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = TREATMENT_ACCENT_BG)}
            >
              Send
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-4 mt-8 pt-5" style={{ borderTop: `1px solid ${DIVIDER_COLOR}` }}>
          <div className="text-center">
            <p className="m-0 text-[22px] font-bold" style={{ color: TEXT_PRIMARY }} lang="fi">
              Nyt vituttaa?
            </p>
            <p className="m-0 mt-1 text-[13px]" style={{ color: TEXT_SECONDARY }}>
              Report any change in condition following the consultation.
            </p>
          </div>
          <button
            onClick={onConfirm}
            className="w-full max-w-[280px] py-3.5 font-semibold text-sm uppercase rounded-lg active:scale-[0.98]"
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
            Yes. Re-assess me
          </button>
          <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-sm active:scale-[0.98]"
            style={SECONDARY_BUTTON_STYLE}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Epicrisis
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 text-xs font-medium uppercase tracking-wide rounded-sm active:scale-[0.98]"
            style={SECONDARY_BUTTON_STYLE}
          >
            New Intake
          </button>
          </div>
        </div>
      )}

      {!ended && (
        <div className="flex items-center justify-center mt-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide"
            style={{ letterSpacing: '0.05em', color: TEXT_SECONDARY }}
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Epicrisis
          </button>
        </div>
      )}
    </div>
  );
}
