// Core type definitions for Tunnetilasi - Metal Music Emotion Matching

// Plutchik's 8 basic emotions, arranged as 4 opposing pairs
// (joy<->sadness, trust<->disgust, fear<->anger, surprise<->anticipation).
export type CoreEmotionType =
  | 'joy'
  | 'trust'
  | 'fear'
  | 'surprise'
  | 'sadness'
  | 'disgust'
  | 'anger'
  | 'anticipation';

// Legacy support for existing emotion detection systems
export type EmotionType = CoreEmotionType;

// 11-tier intensity scale (0-10), Spinal Tap "these go to eleven" — see
// STRESS_TIERS in lib/theme.ts for the label/color for each index.
export type StressLevel = number;

export type MetalSubgenre =
  | 'death'
  | 'black'
  | 'power'
  | 'doom'
  | 'thrash'
  | 'progressive'
  | 'symphonic'
  | 'folk'
  | 'industrial'
  | 'nu-metal';

export interface EmotionWheelSelection {
  emotion: EmotionType;
  stressLevel: StressLevel; // 0-10, snapped from radial drag distance
  position: { x: number; y: number }; // Position on wheel
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre: string;
  previewUrl?: string;
  bandcampUrl?: string;
  artworkUrl?: string;
  duration?: number;
  explicitContent?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
}