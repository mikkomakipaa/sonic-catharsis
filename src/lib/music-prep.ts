// "Prepare me for the music": the genre-first path. The patient picks a genre,
// Seppo stages a short encounter that puts them in the mood that genre calls
// for, and the Curator prescribes the matching artists. There is no diagnosis
// on this path, so there is no Stage, intensity or Matcher call: the genre
// maps straight to the Curator's input via the fixed table below.
//
// The patient answers "What is your favorite music genre?" in free text; the
// scene model mocks the answer and picks one of these five metal archetypes
// (a metal answer maps to its own, a non-metal answer gets the closest metal
// cousin). Each genre is one *performance*, not a louder roast: the brief for
// it lives in `SCENE_PERFORMANCE_BRIEFS` (lib/prompts.ts). Keep ids in sync
// with those briefs (a test enforces it).

import type { z } from 'zod';
import type { SonicProfileSchema } from './validation';

export const MUSIC_GENRE_IDS = ['thrash', 'doom', 'technical', 'black', 'power'] as const;
export type MusicGenreId = (typeof MUSIC_GENRE_IDS)[number];

export interface MusicGenre {
  id: MusicGenreId;
  label: string;
  // The Curator's `subgenre` input. Must satisfy SubgenreSchema.
  subgenre: string;
  // Fixed per genre. Never varied by anything else on this path.
  sonicProfile: z.infer<typeof SonicProfileSchema>;
}

export const MUSIC_GENRES: readonly MusicGenre[] = [
  {
    id: 'thrash',
    label: 'Thrash / groove',
    subgenre: 'Thrash metal / groove metal',
    sonicProfile: { activation: 'aggressive', agency: 'assertion', friction: 'abrasive', cognitive_density: 'direct', weight: 'propulsive' },
  },
  {
    id: 'doom',
    label: 'Doom / funeral doom',
    subgenre: 'Doom metal / funeral doom',
    sonicProfile: { activation: 'restrained', agency: 'surrender', friction: 'textured', cognitive_density: 'primitive', weight: 'crushing' },
  },
  {
    id: 'technical',
    label: 'Technical / progressive death',
    subgenre: 'Technical death metal / progressive death metal',
    sonicProfile: { activation: 'aggressive', agency: 'confrontation', friction: 'abrasive', cognitive_density: 'complex', weight: 'heavy' },
  },
  {
    id: 'black',
    label: 'Black metal',
    subgenre: 'Black metal',
    sonicProfile: { activation: 'overwhelming', agency: 'confrontation', friction: 'confrontational', cognitive_density: 'disorienting', weight: 'oppressive' },
  },
  {
    id: 'power',
    label: 'Power / folk metal',
    subgenre: 'Power metal / folk metal',
    sonicProfile: { activation: 'driving', agency: 'assertion', friction: 'smooth', cognitive_density: 'direct', weight: 'propulsive' },
  },
] as const;

export function isMusicGenreId(value: unknown): value is MusicGenreId {
  return typeof value === 'string' && (MUSIC_GENRE_IDS as readonly string[]).includes(value);
}

export function getMusicGenre(id: MusicGenreId): MusicGenre {
  return MUSIC_GENRES.find((g) => g.id === id)!;
}
