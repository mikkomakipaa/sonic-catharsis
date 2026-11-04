'use client';

import { useEffect, useRef, useState } from 'react';
import type { Stimulus } from '@/lib/provocations';
import {
  DODGE_START,
  canBeCaught,
  etaText,
  nextDodge,
  progressAt,
  statusText,
  type DodgePosition,
} from '@/lib/irritation-loader';

// The irritation-UI stimulus, dressed as a figure plate like StimulusPlate.
// A verification bar stalls at 99%, the ETA lies, and a "Skip" button dodges
// the pointer a few times before it can be caught. Catching it opens a
// confirm whose Yes/No answer both lead to the same place: back to 62%.
// The patient's real Yes/No buttons live outside this panel (ScreenProvoke),
// so nothing here can trap them.
// Dodging is off under prefers-reduced-motion; keyboard focus never dodges.

const PAPER = '#f1ece0';
const INK = '#211e1a';
const TYPEWRITER = 'var(--font-special-elite), "Courier New", monospace';
const BUTTON_W = 88;
const BUTTON_H = 32;

const FAKE_BUTTON_STYLE = {
  letterSpacing: '0.06em',
  color: INK,
  background: PAPER,
  border: `1px solid ${INK}`,
} as const;

export default function IrritationStimulus({ stimulus }: { stimulus: Stimulus }) {
  const caption = `FIG. ${stimulus.fig} — Stimulus: ${stimulus.stimulus}`;
  const [seconds, setSeconds] = useState(0);
  const [setbacks, setSetbacks] = useState(0);
  const [dodges, setDodges] = useState(0);
  const [position, setPosition] = useState<DodgePosition>(DODGE_START);
  const [confirming, setConfirming] = useState(false);
  // Only ever mounted after a click (never server-rendered), so reading
  // matchMedia in the initialiser is safe.
  const [reducedMotion] = useState(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });
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

  const dodge = () => {
    if (reducedMotion || canBeCaught(dodges)) return;
    setDodges((n) => n + 1);
    setPosition((prev) => nextDodge(prev));
  };

  // Mouse dodges on approach; touch and pen have no hover, so they dodge on
  // pointerdown, moving the button out from under the finger before the tap
  // can complete.
  const onPointerEnter = (e: React.PointerEvent) => { if (e.pointerType === 'mouse') dodge(); };
  const onPointerDown = (e: React.PointerEvent) => { if (e.pointerType !== 'mouse') dodge(); };

  const sendBack = () => {
    roundStart.current = Date.now();
    setSeconds(0);
    setSetbacks((n) => n + 1);
    setDodges(0);
    setPosition(DODGE_START);
    setConfirming(false);
  };

  return (
    <figure className="m-0 p-2 rounded-[2px]" style={{ background: PAPER, boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}>
      <div className="px-3 pt-3 pb-3 max-[480px]:px-2" style={{ border: `1px solid ${INK}` }}>
        <div
          className="flex flex-col justify-center gap-3 px-2"
          style={{ aspectRatio: '400 / 258', color: INK, fontFamily: TYPEWRITER }}
        >
          <span className="uppercase text-[11px] tracking-[0.12em] opacity-70 text-center">Verification</span>

          <div>
            <div className="flex justify-between text-[12px]">
              <span role="status">{statusText(percent, setbacks)}</span>
              <span>{percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Verification progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-valuetext={`${percent}%. ${eta}`}
              className="mt-1 h-3 w-full"
              style={{ border: `1px solid ${INK}` }}
            >
              <div className="h-full" style={{ width: `${percent}%`, background: INK }} />
            </div>
            <div className="mt-1 text-[11px] opacity-70">{eta}</div>
          </div>

          {confirming ? (
            <div className="text-[12px]" style={{ minHeight: 56 }}>
              <p className="m-0 leading-snug">
                Skipping will lose your {percent}% progress. Do you want to not cancel the skip?
              </p>
              <div className="mt-2 flex gap-2">
                <button onClick={sendBack} className="px-3 py-1.5 text-[11px] uppercase rounded-[2px]" style={FAKE_BUTTON_STYLE}>
                  Yes
                </button>
                <button onClick={sendBack} className="px-3 py-1.5 text-[11px] uppercase rounded-[2px]" style={FAKE_BUTTON_STYLE}>
                  No
                </button>
              </div>
            </div>
          ) : (
            <div className="relative" style={{ height: 56 }}>
              <button
                onPointerEnter={onPointerEnter}
                onPointerDown={onPointerDown}
                // detail 0 = keyboard activation, which never has to chase the button.
                onClick={(e) => { if (e.detail === 0 || canBeCaught(dodges) || reducedMotion) setConfirming(true); }}
                className="absolute text-[11px] uppercase rounded-[2px]"
                style={{
                  ...FAKE_BUTTON_STYLE,
                  width: BUTTON_W,
                  height: BUTTON_H,
                  left: `calc((100% - ${BUTTON_W}px) * ${position.x})`,
                  top: `calc((100% - ${BUTTON_H}px) * ${position.y})`,
                  transition: reducedMotion ? undefined : 'left 0.12s ease-out, top 0.12s ease-out',
                }}
              >
                Skip
              </button>
            </div>
          )}
        </div>

        <figcaption className="mt-3" style={{ color: INK, fontFamily: TYPEWRITER }}>
          <span className="block text-[12.5px] max-[480px]:text-[12px] leading-snug">{caption}</span>
          <span className="block mt-1 text-[11px] leading-snug opacity-80">{stimulus.legend}</span>
        </figcaption>
      </div>
    </figure>
  );
}
