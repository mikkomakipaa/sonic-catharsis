import { EmotionAnalysis, MetalSubgenre, Track, Playlist } from '@/types';
import { emotionToMetalMapping } from './emotion-mapping';

export class MetalMusicSelectionAgent {
  private appleMusicApiKey?: string;

  constructor(appleMusicApiKey?: string) {
    this.appleMusicApiKey = appleMusicApiKey;
  }

  /**
   * Select metal subgenres based on detected emotions (primary and optional secondary)
   */
  selectMetalGenres(emotion: EmotionAnalysis): {
    primary: MetalSubgenre[];
    secondary: MetalSubgenre[];
    reasoning: string;
  } {
    const primaryMapping = emotionToMetalMapping[emotion.primaryEmotion];
    const secondaryMapping = emotion.secondaryEmotion
      ? emotionToMetalMapping[emotion.secondaryEmotion]
      : null;

    if (!primaryMapping) {
      // Fallback for unknown emotions
      return {
        primary: ['progressive', 'symphonic'],
        secondary: ['power', 'folk'],
        reasoning: 'Using balanced metal genres for unrecognized emotion'
      };
    }

    let allPrimary = [...primaryMapping.primary];
    let allSecondary = [...primaryMapping.secondary];

    // Blend with secondary emotion if present
    if (secondaryMapping && emotion.secondaryIntensity && emotion.secondaryIntensity > 30) {
      // Add secondary emotion genres based on intensity
      const secondaryWeight = emotion.secondaryIntensity / 100;
      const primaryWeight = emotion.primaryIntensity / 100;

      // If secondary emotion is strong, promote some of its genres to primary
      if (secondaryWeight > 0.5) {
        allPrimary.push(...secondaryMapping.primary.slice(0, 1));
      }

      // Add secondary emotion's genres to secondary list
      allSecondary.push(...secondaryMapping.secondary);
    }

    // Remove duplicates and limit results
    allPrimary = [...new Set(allPrimary)].slice(0, 4);
    allSecondary = [...new Set(allSecondary)].slice(0, 3);

    const reasoning = this.generateDualEmotionReasoning(emotion, primaryMapping, secondaryMapping);

    return {
      primary: allPrimary,
      secondary: allSecondary,
      reasoning
    };
  }

  /**
   * Generate reasoning for dual emotion genre selection
   */
  private generateDualEmotionReasoning(
    emotion: EmotionAnalysis,
    primaryMapping: typeof emotionToMetalMapping[keyof typeof emotionToMetalMapping],
    secondaryMapping?: typeof emotionToMetalMapping[keyof typeof emotionToMetalMapping] | null
  ): string {
    const primaryIntensityLevel = emotion.primaryIntensity > 80 ? 'high' :
                                emotion.primaryIntensity > 50 ? 'medium' : 'low';

    const genreDescriptions = {
      anger: 'aggressive and intense metal genres that channel raw energy',
      disgust: 'darker, heavier metal that expresses contempt and revulsion',
      fear: 'atmospheric and ominous metal that embraces darkness',
      joy: 'uplifting and energetic metal with triumphant themes',
      neutral: 'balanced and contemplative metal for steady moods',
      sadness: 'melancholic and emotional metal that resonates with sorrow',
      surprise: 'experimental and unpredictable metal with varied structures'
    };

    let reasoning = `Selected ${genreDescriptions[emotion.primaryEmotion]} based on ${primaryIntensityLevel} intensity ${emotion.primaryEmotion}`;

    if (emotion.secondaryEmotion && emotion.secondaryIntensity && emotion.secondaryIntensity > 30) {
      const secondaryIntensityLevel = emotion.secondaryIntensity > 80 ? 'high' :
                                    emotion.secondaryIntensity > 50 ? 'medium' : 'low';

      reasoning += `, blended with ${secondaryIntensityLevel} intensity ${emotion.secondaryEmotion} for emotional complexity`;
    }

    reasoning += '.';

    return reasoning;
  }

  /**
   * Mock Apple Music search (will be replaced with actual API)
   */
  async searchAppleMusic(
    genres: MetalSubgenre[],
    emotion: EmotionAnalysis
  ): Promise<Track[]> {
    // Mock data - replace with actual Apple Music API calls
    const mockTracks: Record<MetalSubgenre, Track[]> = {
      thrash: [
        {
          id: 'slayer-1',
          name: 'Raining Blood',
          artist: 'Slayer',
          album: 'Reign in Blood',
          genre: 'thrash',
          appleMusicUrl: 'https://music.apple.com/us/song/raining-blood/1440896836',
          artworkUrl: 'https://example.com/slayer-artwork.jpg',
          duration: 249,
          explicitContent: true
        },
        {
          id: 'metallica-1',
          name: 'Master of Puppets',
          artist: 'Metallica',
          album: 'Master of Puppets',
          genre: 'thrash',
          appleMusicUrl: 'https://music.apple.com/us/song/master-of-puppets/1440926457',
          duration: 515,
          explicitContent: false
        },
        {
          id: 'megadeth-1',
          name: 'Holy Wars... The Punishment Due',
          artist: 'Megadeth',
          album: 'Rust in Peace',
          genre: 'thrash',
          appleMusicUrl: 'https://music.apple.com/us/song/holy-wars-the-punishment-due/1440896542',
          duration: 398,
          explicitContent: false
        }
      ],
      death: [
        {
          id: 'death-1',
          name: 'Pull the Plug',
          artist: 'Death',
          album: 'Leprosy',
          genre: 'death',
          appleMusicUrl: 'https://music.apple.com/us/song/pull-the-plug/1440896123',
          duration: 262,
          explicitContent: false
        }
      ],
      black: [
        {
          id: 'mayhem-1',
          name: 'Freezing Moon',
          artist: 'Mayhem',
          album: 'De Mysteriis Dom Sathanas',
          genre: 'black',
          appleMusicUrl: 'https://music.apple.com/us/song/freezing-moon/1440896789',
          duration: 378,
          explicitContent: true
        }
      ],
      power: [
        {
          id: 'helloween-1',
          name: 'Eagle Fly Free',
          artist: 'Helloween',
          album: 'Keeper of the Seven Keys Part II',
          genre: 'power',
          appleMusicUrl: 'https://music.apple.com/us/song/eagle-fly-free/1440896234',
          duration: 245,
          explicitContent: false
        }
      ],
      doom: [
        {
          id: 'candlemass-1',
          name: 'Solitude',
          artist: 'Candlemass',
          album: 'Epicus Doomicus Metallicus',
          genre: 'doom',
          appleMusicUrl: 'https://music.apple.com/us/song/solitude/1440896345',
          duration: 321,
          explicitContent: false
        }
      ],
      progressive: [
        {
          id: 'dreamtheater-1',
          name: 'Pull Me Under',
          artist: 'Dream Theater',
          album: 'Images and Words',
          genre: 'progressive',
          appleMusicUrl: 'https://music.apple.com/us/song/pull-me-under/1440896456',
          duration: 494,
          explicitContent: false
        }
      ],
      symphonic: [
        {
          id: 'nightwish-1',
          name: 'Nemo',
          artist: 'Nightwish',
          album: 'Once',
          genre: 'symphonic',
          appleMusicUrl: 'https://music.apple.com/us/song/nemo/1440896567',
          duration: 273,
          explicitContent: false
        }
      ],
      folk: [
        {
          id: 'eluveitie-1',
          name: 'Inis Mona',
          artist: 'Eluveitie',
          album: 'Slania',
          genre: 'folk',
          appleMusicUrl: 'https://music.apple.com/us/song/inis-mona/1440896678',
          duration: 248,
          explicitContent: false
        }
      ],
      industrial: [
        {
          id: 'rammstein-1',
          name: 'Du Hast',
          artist: 'Rammstein',
          album: 'Sehnsucht',
          genre: 'industrial',
          appleMusicUrl: 'https://music.apple.com/us/song/du-hast/1440896789',
          duration: 234,
          explicitContent: true
        }
      ],
      'nu-metal': [
        {
          id: 'systemofadown-1',
          name: 'Chop Suey!',
          artist: 'System of a Down',
          album: 'Toxicity',
          genre: 'nu-metal',
          appleMusicUrl: 'https://music.apple.com/us/song/chop-suey/1440896890',
          duration: 210,
          explicitContent: true
        }
      ]
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Get tracks for selected genres
    let tracks: Track[] = [];
    for (const genre of genres) {
      if (mockTracks[genre]) {
        tracks.push(...mockTracks[genre]);
      }
    }

    // Shuffle and limit results
    tracks = tracks.sort(() => Math.random() - 0.5).slice(0, 10);

    return tracks;
  }

  /**
   * Create playlist from emotion analysis
   */
  async createPlaylist(emotion: EmotionAnalysis): Promise<Playlist> {
    const genreSelection = this.selectMetalGenres(emotion);
    const allGenres = [...genreSelection.primary, ...genreSelection.secondary];

    const tracks = await this.searchAppleMusic(allGenres, emotion);

    const playlistName = emotion.secondaryEmotion
      ? `${emotion.primaryEmotion.charAt(0).toUpperCase() + emotion.primaryEmotion.slice(1)} & ${emotion.secondaryEmotion.charAt(0).toUpperCase() + emotion.secondaryEmotion.slice(1)} Metal Mix`
      : `${emotion.primaryEmotion.charAt(0).toUpperCase() + emotion.primaryEmotion.slice(1)} Metal Mix`;

    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: playlistName,
      emotion: emotion.primaryEmotion,
      tracks,
      createdAt: new Date(),
      metalSubgenres: allGenres
    };

    return playlist;
  }
}