import {
  EmotionDetectionSession,
  ConversationMessage,
  EmotionAnalysis,
  Playlist,
  AppState
} from '@/types';
import { OpenAIEmotionAgent } from './openai-emotion-agent';
import { MetalMusicSelectionAgent } from './metal-music-agent';

export class TwoAgentOrchestrator {
  private emotionAgent: OpenAIEmotionAgent;
  private musicAgent: MetalMusicSelectionAgent;

  constructor(
    openAIApiKey: string,
    appleMusicApiKey?: string
  ) {
    this.emotionAgent = new OpenAIEmotionAgent(openAIApiKey);
    this.musicAgent = new MetalMusicSelectionAgent(appleMusicApiKey);
  }

  /**
   * Start a new emotion detection session
   */
  startSession(): EmotionDetectionSession {
    const session: EmotionDetectionSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: this.emotionAgent.getInitialGreeting(),
          timestamp: new Date()
        }
      ],
      isComplete: false,
      startedAt: new Date()
    };

    return session;
  }

  /**
   * Process user message and get response from emotion agent
   */
  async processUserMessage(
    session: EmotionDetectionSession,
    userMessage: string
  ): Promise<{
    session: EmotionDetectionSession;
    agentStatus: {
      emotionAgent: 'idle' | 'active' | 'complete';
      musicAgent: 'idle' | 'active' | 'complete';
    };
    playlist?: Playlist;
  }> {
    // Add user message to session
    const userMsg: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    const updatedMessages = [...session.messages, userMsg];

    try {
      // Get response from emotion agent
      const result = await this.emotionAgent.analyzeEmotion(updatedMessages);

      if (result.emotion) {
        // Emotion detection complete - finalize session
        session.messages = updatedMessages;
        session.isComplete = true;
        session.finalEmotion = result.emotion;
        session.completedAt = new Date();

        // Trigger music selection agent
        const playlist = await this.musicAgent.createPlaylist(result.emotion);

        return {
          session,
          agentStatus: {
            emotionAgent: 'complete',
            musicAgent: 'complete'
          },
          playlist
        };

      } else if (result.response) {
        // Continue conversation
        const assistantMsg: ConversationMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        };

        session.messages = [...updatedMessages, assistantMsg];

        return {
          session,
          agentStatus: {
            emotionAgent: 'active',
            musicAgent: 'idle'
          }
        };
      } else {
        throw new Error('No response from emotion agent');
      }

    } catch (error) {
      console.error('Error processing message:', error);

      // Add error message to session
      const errorMsg: ConversationMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: "I'm having trouble processing that right now. Could you try rephrasing how you're feeling?",
        timestamp: new Date()
      };

      session.messages = [...updatedMessages, errorMsg];

      return {
        session,
        agentStatus: {
          emotionAgent: 'idle',
          musicAgent: 'idle'
        }
      };
    }
  }

  /**
   * Get current session status
   */
  getSessionStatus(session: EmotionDetectionSession): {
    isComplete: boolean;
    messageCount: number;
    duration: number;
    finalEmotion?: EmotionAnalysis;
  } {
    const now = new Date();
    const duration = now.getTime() - session.startedAt.getTime();

    return {
      isComplete: session.isComplete,
      messageCount: session.messages.length,
      duration,
      finalEmotion: session.finalEmotion
    };
  }

  /**
   * Reset session for new conversation
   */
  resetSession(): EmotionDetectionSession {
    return this.startSession();
  }

  /**
   * Get conversation summary for debugging/analytics
   */
  getSessionSummary(session: EmotionDetectionSession): {
    sessionId: string;
    duration: number;
    messageCount: number;
    userMessages: number;
    finalEmotion?: string;
    completed: boolean;
  } {
    const userMessages = session.messages.filter(m => m.role === 'user').length;
    const duration = session.completedAt
      ? session.completedAt.getTime() - session.startedAt.getTime()
      : new Date().getTime() - session.startedAt.getTime();

    return {
      sessionId: session.id,
      duration,
      messageCount: session.messages.length,
      userMessages,
      finalEmotion: session.finalEmotion?.emotion,
      completed: session.isComplete
    };
  }
}