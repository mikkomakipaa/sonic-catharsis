// "Prepare me for the music": the genre-first path. The patient picks a genre,
// Seppo stages a short encounter that puts them in the mood that genre calls
// for, and the Curator prescribes the matching artists. There is no diagnosis
// on this path, so there is no Stage, intensity or Matcher call: the genre
// maps straight to the Curator's input via the fixed table below.
//
// Each genre is one *performance*, not a louder roast: the brief for it lives
// in `SCENE_PERFORMANCE_BRIEFS` (lib/prompts.ts), the hand-written opening
// line here. Keep ids in sync with those briefs (a test enforces it).

import type { z } from 'zod';
import type { SonicProfileSchema } from './validation';

export const MUSIC_GENRE_IDS = ['thrash', 'doom', 'technical', 'black', 'power'] as const;
export type MusicGenreId = (typeof MUSIC_GENRE_IDS)[number];

export interface MusicGenre {
  id: MusicGenreId;
  label: string;
  // Short line under the label in the picker: what Seppo will be.
  persona: string;
  // The Curator's `subgenre` input. Must satisfy SubgenreSchema.
  subgenre: string;
  // Fixed per genre. Never varied by anything else on this path.
  sonicProfile: z.infer<typeof SonicProfileSchema>;
  // Seppo's first line, shown the instant the genre is picked. Hand-written:
  // no model call, no greeting, no introduction, the act is already under way.
  opening: string;
}

export const MUSIC_GENRES: readonly MusicGenre[] = [
  {
    id: 'thrash',
    label: 'Thrash / groove',
    persona: 'A manager with new rules',
    subgenre: 'Thrash metal / groove metal',
    sonicProfile: { activation: 'aggressive', agency: 'assertion', friction: 'abrasive', cognitive_density: 'direct', weight: 'propulsive' },
    opening:
      'Right, you. New policy as of four minutes ago: nobody listens to anything without a signed Form 7. And no, I will not tell you where Form 7 is, because you should already know, and frankly I am disappointed in how you handled this.',
  },
  {
    id: 'doom',
    label: 'Doom / funeral doom',
    persona: 'A bureaucrat who knows',
    subgenre: 'Doom metal / funeral doom',
    sonicProfile: { activation: 'restrained', agency: 'surrender', friction: 'textured', cognitive_density: 'primitive', weight: 'crushing' },
    opening:
      'Your request has been received. It will be processed. It will not be approved. Nothing in this building has ever progressed, and I have the filing cabinets to prove it. Please take a seat. The seat is also pending.',
  },
  {
    id: 'technical',
    label: 'Technical / progressive death',
    persona: 'A consultant with dependencies',
    subgenre: 'Technical death metal / progressive death metal',
    sonicProfile: { activation: 'aggressive', agency: 'confrontation', friction: 'abrasive', cognitive_density: 'complex', weight: 'heavy' },
    opening:
      'Happy to help with that, it is a very simple request. First we just need Form B, which unfortunately requires Form A, which can only be issued once Form B is on file. Let me know if anything about that is unclear. Actually, do not. Asking restarts the process.',
  },
  {
    id: 'black',
    label: 'Black metal',
    persona: 'A cold official with a ledger',
    subgenre: 'Black metal',
    sonicProfile: { activation: 'overwhelming', agency: 'confrontation', friction: 'confrontational', cognitive_density: 'disorienting', weight: 'oppressive' },
    opening:
      'Name. No, do not bother, I have already noted your expression on arrival. Your contempt for humanity is at an entry-level stage and, frankly, underdeveloped. I am recording it anyway. Continue.',
  },
  {
    id: 'power',
    label: 'Power / folk metal',
    persona: 'A coach who has seen the prophecy',
    subgenre: 'Power metal / folk metal',
    sonicProfile: { activation: 'driving', agency: 'assertion', friction: 'smooth', cognitive_density: 'direct', weight: 'propulsive' },
    opening:
      'STOP. Look at me. You came in here with a slightly bad Tuesday, and I looked at that Tuesday and I saw a dragon. Do not tell me it was a parking ticket. A hero never calls it that. Tonight, we march.',
  },
] as const;

export function isMusicGenreId(value: unknown): value is MusicGenreId {
  return typeof value === 'string' && (MUSIC_GENRE_IDS as readonly string[]).includes(value);
}

export function getMusicGenre(id: MusicGenreId): MusicGenre {
  return MUSIC_GENRES.find((g) => g.id === id)!;
}

// The opening line is the first Seppo line of every scene transcript. The
// server prepends it itself (never from the client), so the model always sees
// the act it is continuing.
export function getSceneOpening(id: MusicGenreId): string {
  return getMusicGenre(id).opening;
}
