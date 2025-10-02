import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CuratorRequestSchema, validateRequest } from '@/lib/validation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CURATOR_PROMPT_ID = 'pmpt_68d3d91a1af08194997b0de975ffee350667df88badd5a8e';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validation = validateRequest(CuratorRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { analysis, emotionData } = validation.data!;

    if (!CURATOR_PROMPT_ID) {
      return NextResponse.json(
        { error: 'Curator Prompt ID not configured' },
        { status: 500 }
      );
    }

    if (!analysis || !emotionData) {
      return NextResponse.json(
        { error: 'Analysis and emotion data are required' },
        { status: 400 }
      );
    }

    // Use OpenAI Responses API with all required variables
    const response = await openai.responses.create({
      input: `Create playlist for emotion: ${emotionData.primary}, stress: ${emotionData.stressLevel || 'none'}, subgenre: ${analysis.subgenre}${emotionData.event ? `, event: ${emotionData.event}` : ''}`,
      prompt: {
        id: CURATOR_PROMPT_ID,
        variables: {
          subgenre: analysis.subgenre || 'metal',
          primary_emotion: emotionData.primary,
          stress_level: emotionData.stressLevel?.toString() || 'none',
          event: emotionData.event || 'none'
        }
      }
    });

    // Handle different response formats
    let responseText = response.output_text;
    // Analysis processing initiated

    // If output_text is undefined, try to get text from output array
    if (!responseText && response.output && Array.isArray(response.output)) {
      const messageOutput = response.output.find(item => item.type === 'message');
      if (messageOutput && messageOutput.content && messageOutput.content[0]) {
        const firstContent = messageOutput.content[0];
        if ('text' in firstContent) {
          responseText = firstContent.text;
        }
      }
    }

    if (!responseText) {
      // No response text found in expected format
      return NextResponse.json(
        { error: 'No response received from AI' },
        { status: 500 }
      );
    }

    // Parse structured JSON response for artist-based format
    let playlistResult = null;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Handle new artist-based format
        if (parsed.Selection && Array.isArray(parsed.Selection)) {
          playlistResult = {
            artists: parsed.Selection
          };
        }
        // Handle old playlist format for backward compatibility
        else if (parsed.playlist && Array.isArray(parsed.playlist)) {
          playlistResult = {
            playlist: parsed.playlist
          };
        }
        // Handle direct array of artists
        else if (Array.isArray(parsed)) {
          playlistResult = {
            artists: parsed
          };
        }
      } else {
        // Fallback: try to extract artist names from text
        const artistNames = responseText
          .split('\n')
          .map(line => line.trim())
          .filter(line =>
            line.length > 0 &&
            !line.startsWith('{') &&
            !line.startsWith('}')
          )
          .map(line => {
            // Extract artist names from various formats
            const matches = line.match(/([A-Za-z0-9\s&-]+?)(?:\s*[-:]|$)/);
            return matches ? matches[1].trim() : line;
          })
          .filter(name => name.length > 2 && name.length < 50)
          .slice(0, 15); // Limit to 15 artists

        if (artistNames.length > 0) {
          playlistResult = {
            artists: artistNames.map((artist, index) => ({
              artist: artist,
              link: `https://music.apple.com/search?term=${encodeURIComponent(artist)}`
            }))
          };
        }
      }
    } catch (error) {
      // Failed to parse curator response - try to extract artist data from malformed JSON or text
      try {
        // Look for artist patterns in the text response
        const artistPatterns = [
          // Pattern for { \"artist\": \"Name\", \"link\": \"url\" }
          /\"artist\"\\s*:\\s*\"([^\"]+)\"/g,
          // Pattern for artist names in quotes
          /\"([A-Za-z][A-Za-z0-9\\s&'\\-]+)\"/g,
          // Pattern for lines that look like artist names
          /^\\s*-?\\s*([A-Za-z][A-Za-z0-9\\s&'\\-]{2,30})\\s*$/gm
        ];

        let extractedArtists: string[] = [];

        // Try each pattern
        for (const pattern of artistPatterns) {
          const matches = Array.from(responseText.matchAll(pattern));
          if (matches.length > 0) {
            extractedArtists = matches
              .map(match => match[1].trim())
              .filter(name =>
                name.length > 2 &&
                name.length < 50 &&
                !name.toLowerCase().includes('link') &&
                !name.toLowerCase().includes('http')
              )
              .slice(0, 15);
            break;
          }
        }

        if (extractedArtists.length > 0) {
          playlistResult = {
            artists: extractedArtists.map((artist, index) => ({
              artist: artist,
              link: `https://music.apple.com/search?term=${encodeURIComponent(artist)}`
            }))
          };
        } else {
          // Last resort: create a generic fallback
          const fallbackSubgenre = analysis?.subgenre || 'metal';
          playlistResult = {
            artists: [
              { artist: `${fallbackSubgenre} Artist 1`, link: `https://music.apple.com/search?term=${encodeURIComponent(fallbackSubgenre)}` },
              { artist: `${fallbackSubgenre} Artist 2`, link: `https://music.apple.com/search?term=${encodeURIComponent(fallbackSubgenre)}` },
              { artist: `${fallbackSubgenre} Artist 3`, link: `https://music.apple.com/search?term=${encodeURIComponent(fallbackSubgenre)}` }
            ]
          };
        }
      } catch (fallbackError) {
        // Fallback parsing also failed
        return NextResponse.json(
          { error: 'Failed to parse playlist response' },
          { status: 500 }
        );
      }
    }

    if (!playlistResult || (!playlistResult.artists && !playlistResult.playlist)) {
      return NextResponse.json(
        { error: 'No structured playlist received' },
        { status: 500 }
      );
    }

    // Return artist-based or legacy format
    if (playlistResult.artists) {
      return NextResponse.json({
        artists: playlistResult.artists,
        type: 'artists'
      });
    } else {
      // Legacy song-based format for backward compatibility
      return NextResponse.json({
        playlist: playlistResult.playlist,
        type: 'songs'
      });
    }

  } catch (error) {
    // Curator API error occurred
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}