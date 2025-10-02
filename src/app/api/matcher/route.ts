import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { MatcherRequestSchema, validateRequest } from '@/lib/validation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MATCHER_PROMPT_ID = 'pmpt_68d3d94dbcd88197a948cb969863042c062ab4eee2638625';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validation = validateRequest(MatcherRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { emotionData } = validation.data!;

    if (!MATCHER_PROMPT_ID) {
      return NextResponse.json(
        { error: 'Matcher Prompt ID not configured' },
        { status: 500 }
      );
    }

    if (!emotionData) {
      return NextResponse.json(
        { error: 'Emotion data is required' },
        { status: 400 }
      );
    }

    // Use OpenAI Responses API with required variables
    const response = await openai.responses.create({
      input: `Analyze emotional state: ${emotionData.primary}, stress level: ${emotionData.stressLevel || 'none'}${emotionData.event ? `, event: ${emotionData.event}` : ''}`,
      prompt: {
        id: MATCHER_PROMPT_ID,
        variables: {
          emotion: emotionData.primary,
          stress_level: emotionData.stressLevel?.toString() || 'none',
          event: emotionData.event || 'none'
        }
      }
    });

    // Handle different response formats
    let responseText = response.output_text;
    // Response processing completed

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

    // Additional fallback: sometimes the response comes back as an array directly
    if (!responseText && Array.isArray(response.output)) {
      // Try to find a text response in the array
      for (const item of response.output) {
        if (item.content && Array.isArray(item.content)) {
          const textContent = item.content.find(c => c.type === 'output_text' || c.text);
          if (textContent && textContent.text) {
            responseText = textContent.text;
            break;
          }
        }
        // Direct text property on the item
        if (item.text) {
          responseText = item.text;
          break;
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

    // Parse structured JSON response
    let analysisResult = null;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try to extract key information from text

        // Look for mentions of specific subgenres in the text
        const subgenrePatterns = [
          /black metal/i,
          /brutal death metal/i,
          /death metal/i,
          /symphonic metal/i,
          /power metal/i,
          /doom metal/i,
          /thrash metal/i,
          /progressive metal/i
        ];

        let detectedSubgenre = 'metal'; // fallback
        for (const pattern of subgenrePatterns) {
          const match = responseText.match(pattern);
          if (match) {
            detectedSubgenre = match[0].toLowerCase();
            break;
          }
        }

        // Try to extract cause and choice from existing text response
        const paragraphs = responseText.split('\n\n').filter(p => p.trim());
        let cause = '';
        let choice = '';

        // Try to find patterns for cause and choice in the text
        for (const paragraph of paragraphs) {
          if (paragraph.toLowerCase().includes('cause') ||
              paragraph.toLowerCase().includes('stress') ||
              paragraph.toLowerCase().includes('corporate') ||
              paragraph.toLowerCase().includes('transformation') ||
              paragraph.includes('IT')) {
            cause = paragraph.trim();
          } else if (paragraph.toLowerCase().includes('metal') ||
                    paragraph.toLowerCase().includes('catharsis') ||
                    paragraph.toLowerCase().includes('relief') ||
                    paragraph.toLowerCase().includes('chosen')) {
            choice = paragraph.trim();
          }
        }

        // Fallback to splitting the text roughly in half
        if (!cause && !choice && paragraphs.length >= 2) {
          const midpoint = Math.floor(paragraphs.length / 2);
          cause = paragraphs.slice(0, midpoint).join(' ').trim();
          choice = paragraphs.slice(midpoint).join(' ').trim();
        } else if (!cause && !choice && responseText.length > 200) {
          // Split long single paragraph
          const sentences = responseText.split(/[.!?]+/).filter(s => s.trim());
          const midpoint = Math.floor(sentences.length / 2);
          cause = sentences.slice(0, midpoint).join('. ').trim() + '.';
          choice = sentences.slice(midpoint).join('. ').trim() + '.';
        }

        // Create fallback result with extracted cause and choice
        analysisResult = {
          subgenre: detectedSubgenre,
          primary_emotion: emotionData.primary,
          stress_level: emotionData.stressLevel || 'none',
          cause: cause || 'Professional burnout and organizational stress',
          choice: choice || `${detectedSubgenre} provides cathartic relief for the current emotional state`
        };
      }
    } catch (error) {
      // Failed to parse matcher response
      return NextResponse.json(
        { error: 'Failed to parse analysis response' },
        { status: 500 }
      );
    }

    if (!analysisResult) {
      return NextResponse.json(
        { error: 'No structured analysis received' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      analysis: analysisResult,
      reasoning: responseText, // Include full response text for backward compatibility
      cause: analysisResult.cause || responseText, // Separate cause field
      choice: analysisResult.choice || '', // Separate choice field
      subgenre: analysisResult.subgenre || 'metal' // Separate subgenre field
    });

  } catch (error) {
    // Matcher API error occurred
    return NextResponse.json(
      { error: 'Failed to process emotional analysis' },
      { status: 500 }
    );
  }
}