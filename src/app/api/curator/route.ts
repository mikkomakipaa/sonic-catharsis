import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CuratorRequestSchema, validateRequest } from '@/lib/validation';
import { CURATOR_INSTRUCTIONS } from '@/lib/prompts';

const CURATOR_MODEL = 'gpt-4.1';

export async function POST(request: NextRequest) {
  try {
    // Constructed inside the handler, not at module scope — module scope
    // runs during Next.js's build-time "Collecting page data" step, before
    // OPENAI_API_KEY is necessarily available, and the SDK throws
    // immediately on a missing key, failing the build itself.
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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

    if (!analysis || !emotionData) {
      return NextResponse.json(
        { error: 'Analysis and emotion data are required' },
        { status: 400 }
      );
    }

    const subgenre = analysis.subgenre || 'metal';
    const sonicProfile = analysis.sonic_profile;

    // Curator gets only the finished sonic direction — no emotion, stress
    // label, condition, or event. That interpretation work is entirely the
    // Matcher's job now; Curator's job is purely "given this sound, find 10
    // real matching artists." `emotionData` is still accepted on the request
    // (CuratorRequestSchema) and unused here — see validation.ts for why it's
    // kept rather than trimmed.
    //
    // Trying the model's own artist knowledge unconstrained by a code-side
    // candidate pool — see the note in lib/prompts.ts for why.
    const response = await openai.responses.create({
      model: CURATOR_MODEL,
      instructions: CURATOR_INSTRUCTIONS,
      input: `subgenre: ${subgenre}\nactivation: ${sonicProfile.activation}\nagency: ${sonicProfile.agency}\nfriction: ${sonicProfile.friction}\ncognitive_density: ${sonicProfile.cognitive_density}\nweight: ${sonicProfile.weight}`,
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
      console.error('No response text from OpenAI');
      return NextResponse.json(
        { error: 'No response received from AI' },
        { status: 500 }
      );
    }

    console.log('OpenAI Response Text:', responseText.substring(0, 500)); // Log first 500 chars for debugging

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
            artists: artistNames.map((artist) => ({
              artist: artist,
              link: `https://music.apple.com/search?term=${encodeURIComponent(artist)}`
            }))
          };
        }
      }
    } catch {
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
            artists: extractedArtists.map((artist) => ({
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
      } catch {
        // Fallback parsing also failed
        return NextResponse.json(
          { error: 'Failed to parse playlist response' },
          { status: 500 }
        );
      }
    }

    if (!playlistResult || !playlistResult.artists) {
      console.error('Failed to parse playlist. Response text:', responseText.substring(0, 1000));
      console.error('PlaylistResult:', playlistResult);
      return NextResponse.json(
        {
          error: 'No structured playlist received',
          debug: {
            responsePreview: responseText.substring(0, 200),
            playlistResult: playlistResult
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      artists: playlistResult.artists,
      type: 'artists'
    });

  } catch {
    // Curator API error occurred
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
