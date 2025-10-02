import { EmotionAnalysis, EmotionType, ConversationMessage } from '@/types';

// OpenAI Emotion Detection Agent Configuration
export const EMOTION_DETECTION_SYSTEM_PROMPT = `You are an expert emotion detection assistant specializing in understanding human emotional states for music recommendation.

Your role:
1. Engage users in natural conversation to understand their current emotional state
2. Ask follow-up questions to gain deeper context about their feelings
3. Identify the primary emotion from: anger, disgust, fear, joy, neutral, sadness, surprise
4. Provide confidence level and reasoning for your assessment

Guidelines:
- Be empathetic and understanding
- Ask clarifying questions when the emotion is unclear
- Consider situational context (work, relationships, events)
- Look for emotional intensity and nuance
- When confident about the emotion, provide structured analysis

When ready to conclude, respond with JSON in this exact format:
{
  "emotion": "anger|disgust|fear|joy|neutral|sadness|surprise",
  "confidence": 0.8,
  "context": "Brief description of the situation",
  "reasoning": "Why you determined this emotion"
}

Keep conversations natural and supportive. Don't rush to conclusions - it's better to ask 2-3 questions to be accurate.`;

export class OpenAIEmotionAgent {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeEmotion(
    messages: ConversationMessage[]
  ): Promise<{
    response?: string;
    emotion?: EmotionAnalysis;
    needsMoreInfo: boolean
  }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: EMOTION_DETECTION_SYSTEM_PROMPT },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const assistantResponse = data.choices[0]?.message?.content;

      if (!assistantResponse) {
        throw new Error('No response from OpenAI');
      }

      // Check if response contains JSON (final emotion analysis)
      try {
        const jsonMatch = assistantResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const emotionData = JSON.parse(jsonMatch[0]);

          const emotion: EmotionAnalysis = {
            emotion: emotionData.emotion as EmotionType,
            confidence: emotionData.confidence,
            context: emotionData.context,
            reasoning: emotionData.reasoning,
            timestamp: new Date()
          };

          return {
            emotion,
            needsMoreInfo: false
          };
        }
      } catch (jsonError) {
        // Not JSON, continue with regular response
      }

      // Regular conversational response
      return {
        response: assistantResponse,
        needsMoreInfo: true
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to analyze emotion. Please try again.');
    }
  }

  // Generate initial greeting to start the conversation
  getInitialGreeting(): string {
    return "Hi! I'm here to help understand how you're feeling right now so we can find the perfect metal music to match your mood. What's going on in your day? How are you feeling?";
  }

  // Generate follow-up questions based on user input
  generateFollowUpPrompts(userMessage: string): string[] {
    const prompts = [
      "Can you tell me more about what led to feeling this way?",
      "How intense would you say this feeling is right now?",
      "Is this feeling more about a specific situation or a general mood?",
      "Are there other emotions mixed in with what you're experiencing?",
      "What kind of energy level do you have right now?"
    ];

    // Return 2-3 relevant prompts (this could be enhanced with more logic)
    return prompts.slice(0, Math.floor(Math.random() * 2) + 2);
  }
}