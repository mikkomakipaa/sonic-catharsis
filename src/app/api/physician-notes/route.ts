import { NextRequest } from 'next/server';
import { PHYSICIAN_ARTIST_NOTES_INSTRUCTIONS } from '@/lib/prompts';
import { handleArtistNotes } from '@/lib/artist-notes';

// The clinic physician's indication per prescribed artist (everyone who did
// not go through Seppo). See lib/artist-notes.ts.
export const POST = (request: NextRequest) => handleArtistNotes(request, PHYSICIAN_ARTIST_NOTES_INSTRUCTIONS, 'Physician notes');
