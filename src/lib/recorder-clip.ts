// --- Provoke Me: the audio stimulus ------------------------------------------
// A deliberately bad school recorder playing "Hot Cross Buns" (public domain)
// on a loop. Synthesised from scratch as plain samples, so there is no audio
// file to host or license, and the same code runs in the browser (played via
// an AudioBuffer) and in Node (tests, WAV export for auditioning).
//
// The irritation is in the escalation: every loop is a little faster and a
// little sharper than the last, the odd high note squeals, and the final loop
// stops one note short of resolving.

// Notes as [semitones above C5, beats]. C5 = 0, D5 = 2, E5 = 4.
type Note = readonly [number, number];

const E = 4, D = 2, C = 0;

// Hot Cross Buns: E D C | E D C | CCCC DDDD | E D C
const HOT_CROSS_BUNS: readonly Note[] = [
  [E, 1], [D, 1], [C, 2],
  [E, 1], [D, 1], [C, 2],
  [C, 0.5], [C, 0.5], [C, 0.5], [C, 0.5], [D, 0.5], [D, 0.5], [D, 0.5], [D, 0.5],
  [E, 1], [D, 1], [C, 2],
];

export interface RecorderClipOptions {
  sampleRate?: number;
  // Number of times the tune is played. The last one is cut short.
  loops?: number;
  // Seeds the wobble, so a clip is reproducible (tests) but still sloppy.
  seed?: number;
}

const C5_HZ = 523.2511;
const BASE_BEAT_SECONDS = 0.5;
const SPEEDUP_PER_LOOP = 0.1; // each loop 10% faster than the one before
const SHARP_CENTS_PER_LOOP = 18; // ...and 18 cents sharper
const SQUEAL_CHANCE = 0.18; // per note, from the second loop on

// Small seeded PRNG (mulberry32): deterministic, no dependencies.
function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Renders the clip as mono samples in [-1, 1].
export function renderRecorderClip({
  sampleRate = 44100,
  loops = 4,
  seed = 1,
}: RecorderClipOptions = {}): Float32Array<ArrayBuffer> {
  const random = makeRandom(seed);
  const chunks: Float32Array[] = [];
  let phase = 0;

  for (let loop = 0; loop < loops; loop++) {
    const isLastLoop = loop === loops - 1;
    const beatSeconds = BASE_BEAT_SECONDS / (1 + SPEEDUP_PER_LOOP * loop);
    // The final loop drops its closing note: the tune never resolves.
    const notes = isLastLoop && loops > 1 ? HOT_CROSS_BUNS.slice(0, -1) : HOT_CROSS_BUNS;

    for (const [semitones, beats] of notes) {
      const slotSamples = Math.round(beats * beatSeconds * sampleRate);
      // Breath gap between notes; sloppy timing from a little random jitter.
      const noteSamples = Math.max(1, Math.round(slotSamples * (0.82 + random() * 0.1)));
      const cents =
        semitones * 100 +
        loop * SHARP_CENTS_PER_LOOP +
        (random() - 0.4) * 45; // wobbles, and leans sharp
      const baseHz = C5_HZ * Math.pow(2, cents / 1200);
      const squeals = loop > 0 && random() < SQUEAL_CHANCE;
      const vibratoHz = 4.5 + random() * 2;

      const chunk = new Float32Array(slotSamples);
      for (let i = 0; i < noteSamples; i++) {
        const t = i / sampleRate;
        const progress = i / noteSamples;

        // Envelope: quick attack, short release.
        const attack = Math.min(1, t / 0.02);
        const release = Math.min(1, (noteSamples - i) / (0.03 * sampleRate));
        const env = attack * release;

        // Pitch: scoops up into the note, vibrato creeps in late, and a
        // squealing note jumps an octave for its last third.
        const scoop = -35 * Math.exp(-t / 0.05); // cents
        const vibrato = Math.min(1, t / 0.3) * 0.012 * Math.sin(2 * Math.PI * vibratoHz * t);
        let hz = baseHz * Math.pow(2, scoop / 1200) * (1 + vibrato);
        if (squeals && progress > 0.65) hz *= 2.02;

        phase += (2 * Math.PI * hz) / sampleRate;
        const tone =
          Math.sin(phase) + 0.22 * Math.sin(2 * phase) + 0.07 * Math.sin(3 * phase);

        // Breath: a puff on the attack plus a constant hiss.
        const breath = (random() * 2 - 1) * (0.16 * Math.exp(-t / 0.04) + 0.035);

        chunk[i] = env * (0.42 * tone + breath);
      }
      chunks.push(chunk);
    }
  }

  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }

  // Normalise so the loudest sample sits at 0.6, leaving headroom for the
  // squeals without clipping.
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) {
    const gain = 0.6 / peak;
    for (let i = 0; i < out.length; i++) out[i] *= gain;
  }
  return out;
}
