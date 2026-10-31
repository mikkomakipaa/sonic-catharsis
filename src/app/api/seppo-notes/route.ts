import { NextRequest } from 'next/server';
import { SEPPO_ARTIST_NOTES_INSTRUCTIONS } from '@/lib/prompts';
import { handleArtistNotes } from '@/lib/artist-notes';

// Seppo's remark per prescribed artist (Seppo path only). See lib/artist-notes.ts.
export const POST = (request: NextRequest) => handleArtistNotes(request, SEPPO_ARTIST_NOTES_INSTRUCTIONS, 'Seppo notes');
