'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import type { Stimulus } from '@/lib/provocations';
import { encodeWav, renderRecorderClip } from '@/lib/recorder-clip';

// The audio stimulus, dressed as a figure plate like StimulusPlate. Never
// autoplays: the patient presses "Play stimulus", and can stop it at any time.
// The clip is synthesised on first play (lib/recorder-clip.ts), encoded as WAV and cached.

const PAPER = '#f1ece0';
const INK = '#211e1a';
const TYPEWRITER = 'var(--font-special-elite), "Courier New", monospace';

const SAMPLE_RATE = 44100;

// Played through an <audio> element, not Web Audio: iOS Safari mutes Web Audio
// when the ringer switch is on silent, and media elements are not muted.
export default function AudioStimulus({ stimulus }: { stimulus: Stimulus }) {
  const caption = `AUD. ${stimulus.fig} — Stimulus: ${stimulus.stimulus}`;
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
  }, []);

  // Not async before audio.play(): iOS only honours play() inside the tap.
  const play = useCallback(async () => {
    try {
      // Ask iOS 17+ for the playback category so the silent switch is ignored.
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
      if (session) session.type = 'playback';
      if (!audioRef.current) {
        const samples = renderRecorderClip({ sampleRate: SAMPLE_RATE });
        urlRef.current = URL.createObjectURL(new Blob([encodeWav(samples, SAMPLE_RATE)], { type: 'audio/wav' }));
        const audio = new Audio(urlRef.current);
        audio.preload = 'auto';
        audio.onended = () => setPlaying(false);
        audioRef.current = audio;
      }
      const audio = audioRef.current;
      audio.currentTime = 0;
      setPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('Audio stimulus failed to play:', error);
      setPlaying(false);
    }
  }, []);

  // Leaving the stimulus (next one, back, unmount) silences it.
  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  return (
    <figure className="m-0 p-2 rounded-[2px]" style={{ background: PAPER, boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}>
      <div className="px-3 pt-3 pb-3 max-[480px]:px-2" style={{ border: `1px solid ${INK}` }}>
        <div
          className="flex flex-col items-center justify-center gap-3 text-center"
          style={{ aspectRatio: '400 / 258', color: INK, fontFamily: TYPEWRITER }}
        >
          <span className="uppercase text-[13px] tracking-[0.12em] opacity-70">Audio stimulus</span>
          <button
            onClick={playing ? stop : play}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase rounded-[2px] active:scale-[0.98] hover:brightness-95"
            style={{ letterSpacing: '0.08em', color: INK, background: PAPER, border: `1px solid ${INK}` }}
            aria-pressed={playing}
          >
            {playing ? <Square className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
            {playing ? 'Stop stimulus' : 'Play stimulus'}
          </button>
          <span className="text-[13px] opacity-70" role="status">
            {playing ? 'Administering. Observe any change in condition.' : 'Sound on. Press to administer.'}
          </span>
        </div>

        <figcaption className="mt-3" style={{ color: INK, fontFamily: TYPEWRITER }}>
          <span className="block text-[12.5px] max-[480px]:text-[14px] leading-snug">{caption}</span>
          <span className="block mt-1 text-[13px] leading-snug opacity-80">{stimulus.legend}</span>
        </figcaption>
      </div>
    </figure>
  );
}
