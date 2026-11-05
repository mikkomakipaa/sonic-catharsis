'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { Stimulus } from '@/lib/provocations';
import { etaText, progressAt, statusText } from '@/lib/irritation-loader';

// The third stimulus, dressed as a figure plate like StimulusPlate. After an
// image and an audio clip the patient expects a video, so that is what is
// "loading": a dark player frame whose buffer bar stalls at 99%, with a lying
// ETA and a perfectly ordinary "Reload" button. Pressing it opens a confirm
// whose Yes/No answers both lead to the same place: back to 62%. The video
// never plays. The joke is deliberately quiet: nothing moves or misbehaves.
// The patient's real Yes/No buttons live outside this panel (ScreenProvoke),
// so nothing here can trap them.

const PAPER = '#f1ece0';
const INK = '#211e1a';
const TYPEWRITER = 'var(--font-special-elite), "Courier New", monospace';

const FAKE_BUTTON_STYLE = {
  letterSpacing: '0.06em',
  color: INK,
  background: PAPER,
  border: `1px solid ${INK}`,
} as const;

export default function IrritationStimulus({ stimulus }: { stimulus: Stimulus }) {
  const caption = `VID. ${stimulus.fig} — Stimulus: ${stimulus.stimulus}`;
  const [seconds, setSeconds] = useState(0);
  const [setbacks, setSetbacks] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const roundStart = useRef<number | null>(null);

  useEffect(() => {
    roundStart.current = Date.now();
    const timer = setInterval(() => {
      if (roundStart.current !== null) setSeconds((Date.now() - roundStart.current) / 1000);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const percent = progressAt(seconds, setbacks);
  const eta = etaText(seconds, setbacks);

  const sendBack = () => {
    roundStart.current = Date.now();
    setSeconds(0);
    setSetbacks((n) => n + 1);
    setConfirming(false);
  };

  return (
    <figure className="m-0 p-2 rounded-[2px]" style={{ background: PAPER, boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}>
      <div className="px-3 pt-3 pb-3 max-[480px]:px-2" style={{ border: `1px solid ${INK}` }}>
        <div className="flex flex-col gap-2" style={{ color: INK, fontFamily: TYPEWRITER }}>
          <span className="uppercase text-[13px] tracking-[0.12em] opacity-70 text-center">Video stimulus</span>

          {/* The "player": a dark frame, a play icon that does nothing, and
              the buffer bar along the bottom edge. */}
          <div className="relative w-full" style={{ aspectRatio: '16 / 9', background: INK }}>
            <Play
              className="absolute left-1/2 top-[42%] h-9 w-9 -translate-x-1/2 -translate-y-1/2"
              style={{ color: PAPER, opacity: 0.55 }}
              aria-hidden
            />
            <div className="absolute inset-x-3 bottom-3">
              <div
                role="progressbar"
                aria-label="Video buffering progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-valuetext={`${percent}%. ${eta}`}
                className="h-1.5 w-full"
                style={{ background: 'rgba(241,236,224,0.25)' }}
              >
                <div className="h-full" style={{ width: `${percent}%`, background: PAPER }} />
              </div>
            </div>
          </div>

          <div className="flex justify-between text-[14px]">
            <span role="status">{statusText(percent, setbacks)}</span>
            <span>{percent}%</span>
          </div>
          <div className="-mt-1 text-[13px] opacity-70">{eta}</div>

          {confirming ? (
            <div className="text-[14px]" style={{ minHeight: 56 }}>
              <p className="m-0 leading-snug">
                Reloading will lose the {percent}% already buffered. Do you want to not cancel the reload?
              </p>
              <div className="mt-2 flex gap-2">
                <button onClick={sendBack} className="px-3 py-1.5 text-[13px] uppercase rounded-[2px] hover:brightness-95" style={FAKE_BUTTON_STYLE}>
                  Yes
                </button>
                <button onClick={sendBack} className="px-3 py-1.5 text-[13px] uppercase rounded-[2px] hover:brightness-95" style={FAKE_BUTTON_STYLE}>
                  No
                </button>
              </div>
            </div>
          ) : (
            <div style={{ minHeight: 56 }}>
              <button
                onClick={() => setConfirming(true)}
                className="px-3 py-1.5 text-[13px] uppercase rounded-[2px] hover:brightness-95"
                style={FAKE_BUTTON_STYLE}
              >
                Reload
              </button>
            </div>
          )}
        </div>

        <figcaption className="mt-3" style={{ color: INK, fontFamily: TYPEWRITER }}>
          <span className="block text-[12.5px] max-[480px]:text-[14px] leading-snug">{caption}</span>
          <span className="block mt-1 text-[13px] leading-snug opacity-80">{stimulus.legend}</span>
        </figcaption>
      </div>
    </figure>
  );
}
