import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { EmotionAssistantRequestSchema, validateRequest } from '@/lib/validation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validation = validateRequest(EmotionAssistantRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { message, threadId, emotionData } = validation.data!;

    if (!ASSISTANT_ID) {
      return NextResponse.json(
        { error: 'OpenAI Assistant ID not configured' },
        { status: 500 }
      );
    }

    // Create or use existing thread
    let thread;
    if (threadId) {
      thread = await openai.beta.threads.retrieve(threadId);
    } else {
      thread = await openai.beta.threads.create();
    }

    // Prepare message content with emotion and stress context if available
    let messageContent = message;
    if (emotionData) {
      const contextInfo = `\n\nEmotion and Stress Context: ${JSON.stringify(emotionData)}`;
      messageContent += contextInfo;
    }

    // Add instruction for structured JSON response
    messageContent += `\n\nPlease respond with a JSON object in this exact format:
{
  "reasoning": "Your analysis of why these songs match the emotional state (2-3 sentences)",
  "playlist": [
    {"title": "Song Title", "artist": "Artist Name"},
    {"title": "Song Title 2", "artist": "Artist Name 2"},
    ... (20 songs total)
  ]
}`;

    // Add user message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: messageContent,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
    }

    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];

      if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        const response = lastMessage.content[0].text.value;

        // Try to parse structured JSON response
        let structuredResponse = null;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            structuredResponse = JSON.parse(jsonMatch[0]);
          }
        } catch (error) {
          // Response is not JSON, return as plain text
        }

        return NextResponse.json({
          response,
          structuredResponse,
          threadId: thread.id,
          hasStructuredData: !!structuredResponse
        });
      }
    }

    return NextResponse.json(
      { error: 'Failed to get response from assistant' },
      { status: 500 }
    );

  } catch (error) {
    // OpenAI Assistant API error occurred
    return NextResponse.json(
      { error: 'Failed to process emotion analysis' },
      { status: 500 }
    );
  }
}