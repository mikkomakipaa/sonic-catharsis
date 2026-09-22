// Genre-fit filtering over the local artist library, replacing the OpenAI
// vector store the curator prompt used to query. We pre-select a candidate
// pool server-side so the model can only ever recommend real artists.

import artistsData from '../../data/artists-complete-genres.json';

interface ArtistRecord {
  Artist: string;
  avgplaycount: number;
  genres: string[];
  primaryGenre: string;
}

export interface ArtistCandidate {
  artist: string;
  genres: string[];
  primaryGenre: string;
}

const ARTISTS: ArtistRecord[] = (artistsData as { artists: ArtistRecord[] }).artists;

function tokenize(genre: string): string[] {
  return genre.toLowerCase().split(/[\s/-]+/).filter(Boolean);
}

function isMetalArtist(artist: ArtistRecord): boolean {
  return (
    artist.primaryGenre.toLowerCase().includes('metal') ||
    artist.genres.some((g) => g.toLowerCase().includes('metal'))
  );
}

function overlapScore(subgenreTokens: string[], artist: ArtistRecord): number {
  const artistTokens = new Set([artist.primaryGenre, ...artist.genres].flatMap(tokenize));
  return subgenreTokens.reduce((score, token) => score + (artistTokens.has(token) ? 1 : 0), 0);
}

// Ranks metal-tagged artists by how well their genre tags overlap with the
// target subgenre, falling back to the wider metal pool if too few artists
// share any keyword with it (e.g. very niche fusion subgenres).
export function getArtistCandidates(subgenre: string, limit = 30): ArtistCandidate[] {
  const tokens = tokenize(subgenre);

  const scored = ARTISTS.filter(isMetalArtist)
    .map((artist) => ({ artist, score: overlapScore(tokens, artist) }))
    .sort((a, b) => b.score - a.score || b.artist.avgplaycount - a.artist.avgplaycount);

  const withOverlap = scored.filter((entry) => entry.score > 0);
  const pool = withOverlap.length >= limit ? withOverlap : scored;

  return pool.slice(0, limit).map(({ artist }) => ({
    artist: artist.Artist,
    genres: artist.genres,
    primaryGenre: artist.primaryGenre,
  }));
}
