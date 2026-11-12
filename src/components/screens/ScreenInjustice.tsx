'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MAX_VITTUILU_USER_TEXT } from '@/lib/validation';
import { CTA_BACKGROUND, CTA_SHADOW, CTA_TEXT_COLOR, DIVIDER_COLOR, SECTION_LABEL_STYLE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme';

export default function ScreenInjustice({ initial, onSubmit, onBack }: { initial: string; onSubmit: (incident: string) => void; onBack: () => void }) {
  const [answer, setAnswer] = useState(initial);
  return (
    <div className="max-w-3xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      <div className="max-w-2xl mx-auto">
        <span className="uppercase text-[13px] max-[640px]:text-[14px]" style={{ fontFamily: 'var(--font-special-elite), monospace', letterSpacing: '0.04em', color: TEXT_TERTIARY }}>Consultation / 01</span>
        <form className="mt-6 flex flex-col items-center" onSubmit={(e) => { e.preventDefault(); if (answer.trim()) onSubmit(answer.trim()); }}>
          <label htmlFor="consultation-incident" className="mb-2 text-center uppercase max-[640px]:!text-[15px]" style={SECTION_LABEL_STYLE}>What petty injustice did you endure today?</label>
          <p className="mt-0 mb-3 text-sm" style={{ color: TEXT_SECONDARY }}>Tell us what happened.</p>
          <textarea id="consultation-incident" value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} maxLength={MAX_VITTUILU_USER_TEXT} rows={4} placeholder="The self-checkout asked me to wait for assistance again." className="w-full p-3 text-sm max-[640px]:text-[16px] rounded-md focus:placeholder:opacity-0" style={{ color: TEXT_PRIMARY, border: `1px solid ${DIVIDER_COLOR}`, fontFamily: 'var(--font-geist-sans)' }} />
          <button type="submit" disabled={!answer.trim()} className="mt-6 min-h-[44px] px-10 py-4 font-semibold text-sm uppercase tracking-wide flex items-center gap-2 rounded-lg disabled:opacity-50" style={{ background: CTA_BACKGROUND, color: CTA_TEXT_COLOR, boxShadow: CTA_SHADOW }}>Consult Seppo <ArrowRight className="h-4 w-4" /></button>
        </form>
        <button type="button" onClick={onBack} className="mx-auto mt-8 min-h-[44px] flex items-center gap-1 text-[13px] font-medium uppercase" style={{ color: TEXT_SECONDARY }}><ArrowLeft className="h-3 w-3" /> Back to intake</button>
      </div>
    </div>
  );
}
