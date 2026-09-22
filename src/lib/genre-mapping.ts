// Deterministic (emotion, stressValue) -> genre lookup, replacing the AI's
// own subgenre pick. Plutchik's 8 basic emotions x 11 intensity tiers (0-10,
// "these go to eleven"). joy/sadness/anger tiers 0-7 are copied verbatim
// from data/full_mapping_matrix.json (happy/sad/angry rows); everything else
// — tiers 8-10 for every emotion, and all 11 tiers for trust/fear/disgust/
// anticipation/surprise — is drafted content, reviewed and approved in
// conversation rather than lifted from that file.

import type { EmotionType } from '@/types';

interface GenreEntry {
  genre: string;
  fallback: string;
}

const GENRE_MAP: Record<EmotionType, Record<number, GenreEntry>> = {
  joy: {
    0: { genre: 'folk metal', fallback: 'power metal' },
    1: { genre: 'power metal', fallback: 'symphonic metal' },
    2: { genre: 'symphonic metal', fallback: 'melodic heavy metal' },
    3: { genre: 'melodic death metal', fallback: 'heavy metal' },
    4: { genre: 'speed metal', fallback: 'prog power' },
    5: { genre: 'progressive power metal', fallback: 'epic metal' },
    6: { genre: 'epic black metal', fallback: 'melodic death metal' },
    7: { genre: 'avant-garde power/black fusion', fallback: 'experimental metal' },
    8: { genre: 'blackened power metal', fallback: 'symphonic black metal' },
    9: { genre: 'avant-garde black metal', fallback: 'blackened power metal' },
    10: { genre: 'maximalist avant-garde metal opera', fallback: 'avant-garde black metal' },
  },
  trust: {
    0: { genre: 'folk metal', fallback: 'melodic heavy metal' },
    1: { genre: 'melodic heavy metal', fallback: 'power metal' },
    2: { genre: 'symphonic metal', fallback: 'folk metal' },
    3: { genre: 'progressive metal', fallback: 'melodic death metal' },
    4: { genre: 'melodic death metal', fallback: 'prog metal' },
    5: { genre: 'atmospheric prog metal', fallback: 'post-metal' },
    6: { genre: 'post-metal', fallback: 'atmospheric sludge' },
    7: { genre: 'avant-garde prog/post fusion', fallback: 'experimental metal' },
    8: { genre: 'post-black metal', fallback: 'avant-garde prog/post fusion' },
    9: { genre: 'ambient black metal', fallback: 'post-black metal' },
    10: { genre: 'transcendental avant-garde metal', fallback: 'ambient black metal' },
  },
  fear: {
    0: { genre: 'gothic doom', fallback: 'atmospheric doom' },
    1: { genre: 'atmospheric black metal', fallback: 'gothic doom' },
    2: { genre: 'symphonic black metal', fallback: 'atmospheric black metal' },
    3: { genre: 'dark ambient black metal', fallback: 'depressive black metal' },
    4: { genre: 'depressive black metal', fallback: 'raw black metal' },
    5: { genre: 'raw black metal', fallback: 'harsh noise black' },
    6: { genre: 'black metal/noise hybrid', fallback: 'harsh drone' },
    7: { genre: 'horror ambient/black fusion', fallback: 'harsh noise' },
    8: { genre: 'black noise', fallback: 'horror ambient/black fusion' },
    9: { genre: 'harsh noise wall', fallback: 'black noise' },
    10: { genre: 'apocalyptic drone/noise wall', fallback: 'harsh noise wall' },
  },
  surprise: {
    0: { genre: 'folk metal', fallback: 'power metal' },
    1: { genre: 'progressive metal', fallback: 'folk metal' },
    2: { genre: 'avant-garde metal', fallback: 'progressive metal' },
    3: { genre: 'mathcore', fallback: 'avant-garde metal' },
    4: { genre: 'technical death metal', fallback: 'mathcore' },
    5: { genre: 'avant-garde death/black', fallback: 'technical death metal' },
    6: { genre: 'dissonant black/prog fusion', fallback: 'avant-garde death' },
    7: { genre: 'experimental noise/mathcore fusion', fallback: 'harsh noise' },
    8: { genre: 'dissonant death metal', fallback: 'experimental noise/mathcore fusion' },
    9: { genre: 'avant-garde grindcore', fallback: 'dissonant death metal' },
    10: { genre: 'chaos theory: maximal avant-garde grindcore', fallback: 'avant-garde grindcore' },
  },
  sadness: {
    0: { genre: 'gothic doom', fallback: 'melodic doom' },
    1: { genre: 'melodic doom', fallback: 'atmospheric doom' },
    2: { genre: 'death/doom', fallback: 'gothic metal' },
    3: { genre: 'funeral doom', fallback: 'sludge doom' },
    4: { genre: 'atmospheric sludge', fallback: 'depressive black metal' },
    5: { genre: 'depressive black metal', fallback: 'drone doom' },
    6: { genre: 'suicidal black metal', fallback: 'dark ambient' },
    7: { genre: 'harsh drone/black ambient', fallback: 'noise doom' },
    8: { genre: 'funeral drone', fallback: 'harsh drone/black ambient' },
    9: { genre: 'extreme doom drone', fallback: 'funeral drone' },
    10: { genre: 'the abyss: maximal funeral drone', fallback: 'extreme doom drone' },
  },
  disgust: {
    0: { genre: 'sludge metal', fallback: 'groove metal' },
    1: { genre: 'groove metal', fallback: 'sludge metal' },
    2: { genre: 'death/sludge', fallback: 'blackened sludge' },
    3: { genre: 'brutal death metal', fallback: 'slam death' },
    4: { genre: 'slam death', fallback: 'goregrind' },
    5: { genre: 'deathgrind', fallback: 'slam' },
    6: { genre: 'goregrind', fallback: 'noisegrind' },
    7: { genre: 'harsh noise/grind fusion', fallback: 'grindcore' },
    8: { genre: 'mincecore', fallback: 'harsh noise/grind fusion' },
    9: { genre: 'powerviolence', fallback: 'mincecore' },
    10: { genre: 'maximal noisecore annihilation', fallback: 'powerviolence' },
  },
  anger: {
    0: { genre: 'thrash metal', fallback: 'groove metal' },
    1: { genre: 'groove metal', fallback: 'death/thrash' },
    2: { genre: 'death/thrash', fallback: 'melodic death' },
    3: { genre: 'melodic death metal', fallback: 'thrash' },
    4: { genre: 'blackened thrash', fallback: 'death metal' },
    5: { genre: 'brutal death metal', fallback: 'slam' },
    6: { genre: 'black metal', fallback: 'deathgrind' },
    7: { genre: 'war metal', fallback: 'grindcore' },
    8: { genre: 'war black metal', fallback: 'war metal' },
    9: { genre: 'bestial black metal', fallback: 'war black metal' },
    10: { genre: 'total war: maximal bestial black metal', fallback: 'bestial black metal' },
  },
  anticipation: {
    0: { genre: 'power metal', fallback: 'speed metal' },
    1: { genre: 'speed metal', fallback: 'thrash metal' },
    2: { genre: 'melodic thrash', fallback: 'power metal' },
    3: { genre: 'progressive power metal', fallback: 'melodic death metal' },
    4: { genre: 'technical thrash', fallback: 'progressive death metal' },
    5: { genre: 'progressive death metal', fallback: 'technical death metal' },
    6: { genre: 'blackened thrash', fallback: 'avant-garde extreme' },
    7: { genre: 'experimental speed/black fusion', fallback: 'mathcore' },
    8: { genre: 'technical black metal', fallback: 'experimental speed/black fusion' },
    9: { genre: 'cybergrind', fallback: 'technical black metal' },
    10: { genre: 'maximalist mathgrind', fallback: 'cybergrind' },
  },
};

export function getDeterministicGenre(emotion: EmotionType, stressValue: number | null): GenreEntry {
  const tier = Math.min(10, Math.max(0, Math.round(stressValue ?? 5)));
  return GENRE_MAP[emotion][tier];
}
