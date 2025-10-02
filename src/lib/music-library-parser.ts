import { XMLParser } from 'fast-xml-parser';
import OpenAI from 'openai';

export interface MusicTrack {
  id: string;
  artist: string;
  track: string;
  genre: string;
  album?: string;
  playCount?: number;
  year?: number;
  playlist?: string[];
  duration?: number;
  rating?: number;
}

export interface ParsedLibrary {
  tracks: MusicTrack[];
  totalTracks: number;
  genres: string[];
  artists: string[];
}

export class AppleMusicLibraryParser {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Parse Apple Music XML library export
   */
  parseXMLLibrary(xmlContent: string): ParsedLibrary {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
    });

    const parsed = parser.parse(xmlContent);
    const plist = parsed.plist;

    if (!plist?.dict?.dict?.dict) {
      throw new Error('Invalid Apple Music library XML format');
    }

    const tracks: MusicTrack[] = [];
    const genres = new Set<string>();
    const artists = new Set<string>();

    // Navigate to tracks dictionary
    const tracksDict = plist.dict.dict.dict;

    // Handle both single track and multiple tracks
    const trackEntries = Array.isArray(tracksDict) ? tracksDict : [tracksDict];

    for (const trackEntry of trackEntries) {
      if (!trackEntry?.dict) continue;

      const trackData = this.parseTrackDict(trackEntry.dict);
      if (trackData) {
        tracks.push(trackData);
        if (trackData.genre) genres.add(trackData.genre);
        if (trackData.artist) artists.add(trackData.artist);
      }
    }

    return {
      tracks,
      totalTracks: tracks.length,
      genres: Array.from(genres),
      artists: Array.from(artists),
    };
  }

  /**
   * Parse individual track dictionary from Apple Music XML
   */
  private parseTrackDict(dict: any): MusicTrack | null {
    const keys = Array.isArray(dict.key) ? dict.key : [dict.key];
    const values = Array.isArray(dict.string || dict.integer || dict.date)
      ? (dict.string || dict.integer || dict.date)
      : [dict.string || dict.integer || dict.date];

    const trackData: any = {};

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = values[i];

      switch (key) {
        case 'Track ID':
          trackData.id = value?.toString();
          break;
        case 'Name':
          trackData.track = value;
          break;
        case 'Artist':
          trackData.artist = value;
          break;
        case 'Album':
          trackData.album = value;
          break;
        case 'Genre':
          trackData.genre = value;
          break;
        case 'Year':
          trackData.year = parseInt(value);
          break;
        case 'Play Count':
          trackData.playCount = parseInt(value);
          break;
        case 'Total Time':
          trackData.duration = parseInt(value);
          break;
        case 'Rating':
          trackData.rating = parseInt(value);
          break;
      }
    }

    // Validate required fields
    if (!trackData.artist || !trackData.track) {
      return null;
    }

    // Set default genre for metal filter
    if (!trackData.genre) {
      trackData.genre = 'Unknown';
    }

    return trackData as MusicTrack;
  }

  /**
   * Filter tracks by metal genres
   */
  filterMetalTracks(tracks: MusicTrack[]): MusicTrack[] {
    const metalGenres = [
      'metal', 'heavy metal', 'death metal', 'black metal', 'thrash metal',
      'progressive metal', 'power metal', 'doom metal', 'gothic metal',
      'symphonic metal', 'folk metal', 'viking metal', 'melodic death metal',
      'metalcore', 'deathcore', 'hardcore', 'post-hardcore', 'mathcore',
      'grindcore', 'sludge metal', 'stoner metal', 'nu metal', 'industrial metal',
      'alternative metal', 'groove metal', 'speed metal', 'glam metal'
    ];

    return tracks.filter(track => {
      const genre = track.genre.toLowerCase();
      return metalGenres.some(metalGenre => genre.includes(metalGenre));
    });
  }

  /**
   * Generate embeddings for tracks
   */
  async generateTrackEmbeddings(tracks: MusicTrack[]): Promise<Array<{track: MusicTrack, embedding: number[]}>> {
    const results = [];

    // Process in batches to avoid rate limits
    const batchSize = 100;
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);

      const embeddings = await Promise.all(
        batch.map(track => this.generateSingleTrackEmbedding(track))
      );

      for (let j = 0; j < batch.length; j++) {
        results.push({
          track: batch[j],
          embedding: embeddings[j],
        });
      }

      // Rate limiting delay
      if (i + batchSize < tracks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Generate embedding for a single track
   */
  private async generateSingleTrackEmbedding(track: MusicTrack): Promise<number[]> {
    // Create text representation for embedding
    const trackText = this.createTrackTextRepresentation(track);

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: trackText,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error(`Failed to generate embedding for track ${track.id}:`, error);
      // Return zero vector as fallback
      return new Array(3072).fill(0); // text-embedding-3-large has 3072 dimensions
    }
  }

  /**
   * Create text representation of track for embedding
   */
  private createTrackTextRepresentation(track: MusicTrack): string {
    const parts = [
      `Artist: ${track.artist}`,
      `Track: ${track.track}`,
      `Genre: ${track.genre}`,
    ];

    if (track.album) parts.push(`Album: ${track.album}`);
    if (track.year) parts.push(`Year: ${track.year}`);

    // Add emotional/stylistic context for better matching
    const emotionalContext = this.inferEmotionalContext(track);
    if (emotionalContext) parts.push(`Style: ${emotionalContext}`);

    return parts.join('. ');
  }

  /**
   * Infer emotional context from genre and track metadata
   */
  private inferEmotionalContext(track: MusicTrack): string {
    const genre = track.genre.toLowerCase();
    const trackName = track.track.toLowerCase();
    const artist = track.artist.toLowerCase();

    // Map genres to emotional contexts
    const genreEmotions: Record<string, string> = {
      'death metal': 'aggressive intense dark brutal',
      'black metal': 'dark atmospheric melancholic evil',
      'thrash metal': 'fast aggressive energetic violent',
      'doom metal': 'slow heavy melancholic depressive',
      'power metal': 'epic uplifting energetic heroic',
      'progressive metal': 'complex technical cerebral',
      'melodic death metal': 'melodic aggressive beautiful harsh',
      'metalcore': 'aggressive emotional breakdown heavy',
      'gothic metal': 'dark romantic atmospheric melancholic',
      'symphonic metal': 'orchestral epic beautiful dramatic',
    };

    // Find matching genre emotion
    for (const [genreKey, emotions] of Object.entries(genreEmotions)) {
      if (genre.includes(genreKey)) {
        return emotions;
      }
    }

    // Fallback to general metal emotions
    return 'heavy intense powerful energetic';
  }

  /**
   * Export processed data to JSON
   */
  exportToJSON(data: ParsedLibrary): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export tracks to CSV format
   */
  exportToCSV(tracks: MusicTrack[]): string {
    const headers = ['id', 'artist', 'track', 'genre', 'album', 'year', 'playCount', 'duration'];
    const csvRows = [headers.join(',')];

    tracks.forEach(track => {
      const row = headers.map(header => {
        const value = track[header as keyof MusicTrack];
        return value !== undefined ? `"${value.toString().replace(/"/g, '""')}"` : '';
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}