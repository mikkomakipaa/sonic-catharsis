// Core type definitions for Tunnetilasi - Metal Music Emotion Matching

// 12-emotion set for metal music matching
export type CoreEmotionType =
  // Happy quadrant
  | 'happy'
  | 'excited'
  | 'content'
  // Sad quadrant
  | 'sad'
  | 'tired'
  | 'inconsolable'
  // Angry quadrant
  | 'angry'
  | 'enraged'
  | 'hysterical'
  // Calm quadrant
  | 'calm'
  | 'worried'
  | 'energetic';

// Legacy support for existing emotion detection systems
export type EmotionType = CoreEmotionType;

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

export interface EmotionAnalysis {
  primaryEmotion: EmotionType;
  secondaryEmotion?: EmotionType;
  primaryIntensity: number; // 0-100
  secondaryIntensity?: number; // 0-100
  timestamp: Date;
}

export interface EmotionWheelSelection {
  emotion: EmotionType;
  intensity: number; // 0-100
  position: { x: number; y: number }; // Position on wheel
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface EmotionDetectionSession {
  id: string;
  messages: ConversationMessage[];
  isComplete: boolean;
  finalEmotion?: EmotionAnalysis;
  startedAt: Date;
  completedAt?: Date;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre: MetalSubgenre;
  previewUrl?: string;
  appleMusicUrl: string;
  artworkUrl?: string;
  duration?: number;
  explicitContent: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  emotion: EmotionType;
  tracks: Track[];
  createdAt: Date;
  metalSubgenres: MetalSubgenre[];
}

export interface UserPreferences {
  favoriteSubgenres: MetalSubgenre[];
  dislikedSubgenres: MetalSubgenre[];
  explicitContentAllowed: boolean;
  preferredArtists: string[];
  savedPlaylists: string[];
}

export interface AppState {
  currentSession: EmotionDetectionSession | null;
  isAnalyzing: boolean;
  currentEmotion: EmotionAnalysis | null;
  currentPlaylist: Playlist | null;
  userPreferences: UserPreferences;
  recentSessions: string[];
  cachedPlaylists: Map<string, Playlist>;
  isPlayerAvailable: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  agentStatus: {
    emotionAgent: 'idle' | 'active' | 'complete';
    musicAgent: 'idle' | 'active' | 'complete';
  };
}

export interface EmotionToGenreMapping {
  [key: string]: {
    primary: MetalSubgenre[];
    secondary: MetalSubgenre[];
    keywords: string[];
  };
}

export interface AppleMusicSearchParams {
  term: string;
  types: string[];
  limit: number;
  offset?: number;
  genre?: string;
}

export interface PlayerControls {
  play: () => Promise<void>;
  pause: () => void;
  skip: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
}