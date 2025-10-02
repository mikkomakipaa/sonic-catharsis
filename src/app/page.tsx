'use client';

import { useState } from 'react';
import { Music, Zap, ExternalLink, MessageSquare, Target, RefreshCw, Send, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmotionAnalysis, EmotionWheelSelection, Playlist } from '@/types';
import EmotionWheel from '@/components/EmotionWheel';
import StressSelector, { StressLevel } from '@/components/StressSelector';
import { MetalMusicSelectionAgent } from '@/lib/metal-music-agent';

export default function Home() {
  // Emotion and Stress State
  const [primarySelection, setPrimarySelection] = useState<EmotionWheelSelection | null>(null);
  const [stressLevel, setStressLevel] = useState<StressLevel | null>(null);
  const [eventDescription, setEventDescription] = useState<string>('');

  // AI Assistant State
  const [threadId, setThreadId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Shared State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [emotionAnalysis, setEmotionAnalysis] = useState<EmotionAnalysis | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [cause, setCause] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [subgenre, setSubgenre] = useState<string | null>(null);

  // Theme State
  const [playfulMode, setPlayfulMode] = useState(false);

  const musicAgent = new MetalMusicSelectionAgent();


  const startAssistantWithWheelData = async () => {
    if (!primarySelection) return;

    setIsProcessing(true);
    setIsAnalyzing(true);
    setCurrentMessage('');
    setReasoning(null);
    setPlaylist(null);

    // Create emotion and stress data for assistant context
    const emotionData = {
      primary: primarySelection.emotion,
      stressLevel: stressLevel || null,
      event: eventDescription.trim() || null
    };

    try {
      // Step 1: Get analysis from matcher assistant
      const matcherResponse = await fetch('/api/matcher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotionData
        }),
      });

      const matcherData = await matcherResponse.json();

      if (matcherData.error) {
        throw new Error(matcherData.error);
      }

      // Set analysis data for middle column
      setReasoning(matcherData.reasoning);
      setCause(matcherData.cause || matcherData.reasoning);
      setChoice(matcherData.choice || '');
      setSubgenre(matcherData.subgenre || matcherData.analysis?.subgenre || 'metal');
      setIsAnalyzing(false);

      // Wait a moment to show the analysis before proceeding
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Get playlist from curator assistant
      const curatorResponse = await fetch('/api/curator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis: matcherData.analysis,
          emotionData
        }),
      });

      const curatorData = await curatorResponse.json();

      if (curatorData.error) {
        throw new Error(curatorData.error);
      }

      // Handle different response types from curator
      if (curatorData.type === 'artists' && curatorData.artists && curatorData.artists.length > 0) {
        // New artist-based format
        const tracks = curatorData.artists.map((artistItem: any, index: number) => ({
          id: `artist-${index}`,
          name: artistItem.artist || artistItem.name || artistItem,
          artist: artistItem.artist || artistItem.name || artistItem,
          album: 'Artist Collection',
          genre: 'metal',
          bandcampUrl: artistItem.link || `https://bandcamp.com/search?q=${encodeURIComponent(artistItem.artist || artistItem.name || artistItem)}`
        }));

        const playlistFromResponse = {
          id: 'ai-generated',
          name: 'Curated Artists',
          description: `15 curated artists for ${emotionData.primary} mood`,
          tracks: tracks
        };
        setPlaylist(playlistFromResponse);
      } else if (curatorData.playlist && curatorData.playlist.length > 0) {
        // Legacy song-based format
        const tracks = curatorData.playlist.map((track: any, index: number) => ({
          id: `track-${index}`,
          name: track.song,
          artist: track.artist,
          album: 'Unknown Album',
          genre: 'metal',
          appleMusicUrl: `https://music.apple.com/search?term=${encodeURIComponent(track.song + ' ' + track.artist)}`
        }));

        const playlistFromResponse = {
          id: 'ai-generated',
          name: 'Curated Playlist',
          description: curatorData.playlistDescription,
          tracks: tracks
        };
        setPlaylist(playlistFromResponse);
      }

    } catch (error) {
      console.error('Error processing emotion analysis:', error);
      setReasoning('Failed to analyze emotional state. Please try again.');
      setIsAnalyzing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSelections = () => {
    setPrimarySelection(null);
    setStressLevel(null);
    setEventDescription('');
    setPlaylist(null);
    setEmotionAnalysis(null);
    setReasoning(null);
    setCause(null);
    setChoice(null);
    setSubgenre(null);
  };

  const canStartAssistant = primarySelection && !isProcessing && !reasoning;

  // AI Assistant Functions
  const sendMessageToAssistant = async () => {
    if (!currentMessage.trim() || isProcessing) return;

    setIsProcessing(true);
    const userMessage = currentMessage;
    setCurrentMessage('');

    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/emotion-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          threadId: threadId,
          emotionData: primarySelection ? {
            primary: primarySelection.emotion,
            stressLevel: stressLevel || null
          } : null
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setThreadId(data.threadId);

      // Handle structured response
      if (data.hasStructuredData && data.structuredResponse) {
        // Set reasoning for middle column
        setReasoning(data.structuredResponse.reasoning);

        // Convert playlist data and set for right column
        if (data.structuredResponse.playlist && data.structuredResponse.playlist.length > 0) {
          const tracks = data.structuredResponse.playlist.map((track: any, index: number) => ({
            id: `track-${index}`,
            name: track.title,
            artist: track.artist,
            album: 'Unknown Album',
            genre: 'metal',
            appleMusicUrl: `https://music.apple.com/search?term=${encodeURIComponent(track.title + ' ' + track.artist)}`
          }));

          const playlistFromResponse = {
            id: 'ai-generated',
            name: 'Curated Playlist',
            tracks: tracks
          };
          setPlaylist(playlistFromResponse);
        }
      } else {
        // Fallback: add full response to conversation for debugging
        setConversation(prev => [...prev, { role: 'assistant', content: data.response }]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Could you try again?'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    // Reset emotion and stress
    setPrimarySelection(null);
    setStressLevel(null);
    setEventDescription('');

    // Reset AI assistant
    setThreadId(null);
    setConversation([]);
    setCurrentMessage('');

    // Reset shared state
    setPlaylist(null);
    setEmotionAnalysis(null);
    setReasoning(null);
    setCause(null);
    setChoice(null);
    setSubgenre(null);
    setIsAnalyzing(false);
    setIsProcessing(false);
  };


  return (
    <div
      className={cn(
        "min-h-screen text-white relative transition-all duration-500",
        playfulMode
          ? "bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400"
          : "bg-gradient-to-br from-slate-900 via-zinc-900 to-black"
      )}
    >
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: playfulMode
            ? `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='8'/%3E%3Ccircle cx='15' cy='15' r='4'/%3E%3Ccircle cx='45' cy='15' r='4'/%3E%3Ccircle cx='15' cy='45' r='4'/%3E%3Ccircle cx='45' cy='45' r='4'/%3E%3C/g%3E%3C/svg%3E")`
            : `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 0L30 17.32L20 34.64L10 17.32z' fill-opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: playfulMode ? '60px 60px' : '40px 40px'
        }}
      />

      <div className="container mx-auto px-4 py-4 max-w-7xl relative">
        {/* Header */}
        <header className="text-center mb-6 relative">
          <div className="mb-3">
            <h1
              className={cn(
                "text-4xl font-bold tracking-wide transition-all duration-500",
                playfulMode
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 animate-pulse"
                  : "text-white"
              )}
              style={{ letterSpacing: playfulMode ? '0.1em' : '0.05em' }}
            >
              {playfulMode ? '✨ SONIC CATHARSIS ✨' : 'SONIC CATHARSIS'}
            </h1>
            <div
              className={cn(
                "h-0.5 w-32 mx-auto mt-2 transition-all duration-500",
                playfulMode
                  ? "bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 h-1 w-48"
                  : "bg-gradient-to-r from-transparent via-red-600 to-transparent"
              )}
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setPlayfulMode(!playfulMode)}
            className={cn(
              "absolute right-0 top-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105",
              playfulMode
                ? "bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg shadow-pink-500/50"
                : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600"
            )}
          >
            {playfulMode ? '🌈 Party Mode!' : '🎨 Theme'}
          </button>
        </header>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-[700px]">

          {/* LEFT COLUMN - Emotion Wheels */}
          <div className="xl:col-span-5">
            <div
              className={cn(
                "backdrop-blur-sm rounded-xl border p-4 transition-all duration-500 flex flex-col items-center",
                playfulMode
                  ? "bg-white/60 border-pink-300 shadow-2xl shadow-pink-500/30"
                  : "bg-zinc-800/50 border-zinc-700"
              )}
              style={!playfulMode ? {
                boxShadow: `
                  0 8px 32px rgba(0,0,0,0.3),
                  inset 0 1px 0 rgba(255,255,255,0.05),
                  inset 0 -1px 0 rgba(0,0,0,0.2)
                `,
                background: 'linear-gradient(135deg, rgba(63,63,70,0.5) 0%, rgba(39,39,42,0.5) 100%)'
              } : {}}
            >
              <h2
                className={cn(
                  "text-lg font-bold text-center mb-3 tracking-wide transition-all duration-500",
                  playfulMode
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600"
                    : "text-white"
                )}
                style={{ letterSpacing: playfulMode ? '0.1em' : '0.05em' }}
              >
                {playfulMode ? '💭 STATE OF MIND 💭' : 'STATE OF MIND'}
              </h2>

              {/* Emotion Wheel and Stress Selector Side by Side */}
              <div className="mb-4 flex gap-6 items-start justify-center">
                <div className="flex-shrink-0">
                  <EmotionWheel
                    title="Emotion"
                    selection={primarySelection}
                    onSelectionChange={setPrimarySelection}
                    playfulMode={playfulMode}
                  />
                </div>
                <div className="flex-shrink-0">
                  <StressSelector
                    title="Stress level (V-käyrä)"
                    selection={stressLevel}
                    onSelectionChange={setStressLevel}
                    playfulMode={playfulMode}
                  />
                </div>
              </div>

              {/* Event Text Input */}
              <div className="mb-4 w-full max-w-2xl">
                <div className="flex flex-col space-y-2">
                  <label
                    className={cn(
                      "text-sm font-semibold text-center transition-colors duration-500",
                      playfulMode ? "text-purple-900" : "text-white"
                    )}
                  >
                    First-world problem encountered today
                  </label>
                  <textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder={playfulMode ? "Tell me what happened! ✨" : "Describe the event or situation..."}
                    className={cn(
                      "w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 transition-all duration-500",
                      playfulMode
                        ? "bg-white/80 border-purple-300 text-gray-800 focus:ring-purple-400 placeholder-purple-400"
                        : "bg-zinc-700/50 border-zinc-600 text-white focus:ring-red-500/50 focus:border-red-500/50 placeholder-zinc-400"
                    )}
                    rows={3}
                    style={!playfulMode ? {
                      background: 'linear-gradient(135deg, rgba(63,63,70,0.5) 0%, rgba(39,39,42,0.7) 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                    } : {}}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="space-y-3 w-full max-w-2xl">
                <button
                  onClick={startAssistantWithWheelData}
                  disabled={!canStartAssistant}
                  className={cn(
                    "w-full px-4 py-3 font-medium text-base transition-all duration-300 flex items-center justify-center gap-2 border border-opacity-30",
                    "transform-gpu transition-transform active:scale-95",
                    playfulMode && canStartAssistant && "animate-bounce",
                    canStartAssistant
                      ? playfulMode
                        ? "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-400 hover:via-purple-400 hover:to-indigo-400 text-white border-pink-400 shadow-lg shadow-purple-500/50"
                        : "bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-red-400 shadow-lg hover:shadow-red-500/25"
                      : playfulMode
                        ? "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed border-gray-400"
                        : "bg-gradient-to-b from-zinc-700 to-zinc-800 text-zinc-400 cursor-not-allowed border-zinc-600"
                  )}
                  style={!playfulMode ? {
                    borderRadius: '6px',
                    boxShadow: canStartAssistant
                      ? '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)'
                      : '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)'
                  } : { borderRadius: '12px' }}
                >
                  {isProcessing ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-5 w-5 border-2 border-transparent border-t-white"
                        style={{
                          filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))'
                        }}
                      ></div>
                      <span className="tracking-wide font-semibold">{playfulMode ? '✨ ANALYZING...' : 'ANALYZING...'}</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-5 w-5" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                      <span className="tracking-wide font-semibold">{playfulMode ? '🚀 SUBMIT FOR ANALYSIS!' : 'SUBMIT FOR ANALYSIS'}</span>
                    </>
                  )}
                </button>

                {(primarySelection || stressLevel || eventDescription) && (
                  <button
                    onClick={resetSelections}
                    className="w-full px-3 py-2 bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-zinc-200 text-sm font-medium tracking-wide transition-all duration-200 border border-zinc-600 border-opacity-30 active:scale-95"
                    style={{
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)'
                    }}
                  >
                    RESET SELECTIONS
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN - Reasoning */}
          <div className="xl:col-span-5">
            {(cause || choice || subgenre) ? (
              <div
                className={cn(
                  "backdrop-blur-sm rounded-xl border h-full flex flex-col transition-all duration-500",
                  playfulMode
                    ? "bg-white/70 border-purple-300 shadow-2xl shadow-purple-500/30"
                    : "bg-zinc-800/50 border-zinc-700"
                )}
                style={!playfulMode ? {
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.05),
                    inset 0 -1px 0 rgba(0,0,0,0.2)
                  `,
                  background: 'linear-gradient(135deg, rgba(63,63,70,0.5) 0%, rgba(39,39,42,0.5) 100%)'
                } : {}}
              >
                <div className={cn(
                  "p-3 border-b transition-colors duration-500",
                  playfulMode ? "border-purple-200" : "border-zinc-700"
                )}>
                  <h2
                    className={cn(
                      "text-lg font-bold text-center tracking-wide transition-all duration-500",
                      playfulMode
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-purple-700"
                        : "text-white"
                    )}
                    style={{ letterSpacing: playfulMode ? '0.1em' : '0.05em' }}
                  >
                    AI ANALYSIS
                  </h2>
                </div>

                {/* Analysis Content */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">

                  {/* Cause Section */}
                  {cause && (
                    <div
                      className={cn(
                        "backdrop-blur-sm rounded-lg border p-3 transition-all duration-500",
                        playfulMode
                          ? "bg-yellow-100/80 border-yellow-300"
                          : "bg-zinc-700/40 border-zinc-600/50"
                      )}
                      style={!playfulMode ? {
                        boxShadow: `
                          0 4px 16px rgba(0,0,0,0.2),
                          inset 0 1px 0 rgba(255,255,255,0.05),
                          inset 0 -1px 0 rgba(0,0,0,0.15)
                        `,
                        background: 'linear-gradient(135deg, rgba(75,85,99,0.4) 0%, rgba(55,65,81,0.4) 100%)'
                      } : {}}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Zap
                          className={cn(
                            "h-4 w-4 transition-colors duration-500",
                            playfulMode ? "text-yellow-600" : "text-orange-400"
                          )}
                          style={{ filter: playfulMode ? 'drop-shadow(0 0 4px rgba(202, 138, 4, 0.5))' : 'drop-shadow(0 0 4px rgba(251,146,60,0.5))' }}
                        />
                        <h3
                          className={cn(
                            "text-sm font-bold tracking-wide transition-colors duration-500",
                            playfulMode ? "text-yellow-800" : "text-orange-400"
                          )}
                          style={{ letterSpacing: '0.05em' }}
                        >
                          CAUSE
                        </h3>
                      </div>
                      <p className={cn(
                        "leading-relaxed text-sm transition-colors duration-500",
                        playfulMode ? "text-gray-900 font-medium" : "text-zinc-100"
                      )}>{cause}</p>
                    </div>
                  )}

                  {/* Choice Section */}
                  {choice && (
                    <div
                      className={cn(
                        "backdrop-blur-sm rounded-lg border p-3 transition-all duration-500",
                        playfulMode
                          ? "bg-pink-100/80 border-pink-300"
                          : "bg-zinc-700/40 border-zinc-600/50"
                      )}
                      style={!playfulMode ? {
                        boxShadow: `
                          0 4px 16px rgba(0,0,0,0.2),
                          inset 0 1px 0 rgba(255,255,255,0.05),
                          inset 0 -1px 0 rgba(0,0,0,0.15)
                        `,
                        background: 'linear-gradient(135deg, rgba(75,85,99,0.4) 0%, rgba(55,65,81,0.4) 100%)'
                      } : {}}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Music
                          className={cn(
                            "h-4 w-4 transition-colors duration-500",
                            playfulMode ? "text-pink-600" : "text-green-400"
                          )}
                          style={{ filter: playfulMode ? 'drop-shadow(0 0 4px rgba(219, 39, 119, 0.5))' : 'drop-shadow(0 0 4px rgba(74,222,128,0.5))' }}
                        />
                        <h3
                          className={cn(
                            "text-sm font-bold tracking-wide transition-colors duration-500",
                            playfulMode ? "text-pink-800" : "text-green-400"
                          )}
                          style={{ letterSpacing: '0.05em' }}
                        >
                          CHOICE
                        </h3>
                      </div>
                      <p className={cn(
                        "leading-relaxed text-sm transition-colors duration-500",
                        playfulMode ? "text-gray-900 font-medium" : "text-zinc-100"
                      )}>{choice}</p>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div
                className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700 h-full flex items-center justify-center"
                style={{
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.05),
                    inset 0 -1px 0 rgba(0,0,0,0.2)
                  `,
                  background: 'linear-gradient(135deg, rgba(63,63,70,0.5) 0%, rgba(39,39,42,0.5) 100%)'
                }}
              >
                <div className="text-center text-zinc-400 p-6">
                  {isAnalyzing ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-red-500 mx-auto mb-3"
                        style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' }}
                      ></div>
                      <h3 className="text-base font-medium mb-2 tracking-wide">ANALYZING...</h3>
                      <p className="text-sm">AI is analyzing your emotional state and matching subgenres.</p>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-zinc-600" />
                      <h3 className="text-base font-medium mb-2 tracking-wide">READY FOR ANALYSIS</h3>
                      <p className="text-sm">Select your emotions and click "Submit for Analysis" to get started.</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Playlist */}
          <div className="xl:col-span-2">
            {playlist ? (
              <div
                className={cn(
                  "backdrop-blur-sm rounded-xl border h-full flex flex-col transition-all duration-500",
                  playfulMode
                    ? "bg-white/70 border-indigo-300 shadow-2xl shadow-indigo-500/30"
                    : "bg-zinc-800/50 border-zinc-700"
                )}
                style={!playfulMode ? {
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.05),
                    inset 0 -1px 0 rgba(0,0,0,0.2)
                  `,
                  background: 'linear-gradient(135deg, rgba(63,63,70,0.5) 0%, rgba(39,39,42,0.5) 100%)'
                } : undefined}
              >
                <div className={cn(
                  "p-3 border-b transition-colors duration-500",
                  playfulMode ? "border-indigo-200" : "border-zinc-700"
                )}>
                  <div className="flex items-center gap-2">
                    <Music
                      className={cn(
                        "h-5 w-5 transition-colors duration-500",
                        playfulMode ? "text-indigo-600" : "text-red-500"
                      )}
                      style={{ filter: playfulMode ? 'drop-shadow(0 0 4px rgba(79, 70, 229, 0.5))' : 'drop-shadow(0 0 4px rgba(239,68,68,0.5))' }}
                    />
                    <h2
                      className={cn(
                        "text-lg font-bold tracking-wide transition-colors duration-500",
                        playfulMode ? "text-indigo-900" : "text-white"
                      )}
                      style={{ letterSpacing: '0.05em' }}
                    >
                      {playlist.name.toUpperCase()}
                    </h2>
                  </div>
                </div>

                <div className="flex-1 p-2 overflow-y-auto space-y-1.5">
                  {playlist.tracks.map((track) => (
                    <div
                      key={track.id}
                      className={cn(
                        "flex items-center justify-between p-1.5 rounded-md border transition-all duration-500",
                        playfulMode
                          ? "bg-indigo-100/60 border-indigo-200 hover:bg-indigo-200/60"
                          : "bg-zinc-700/30 border-zinc-600/50 hover:bg-zinc-700/50"
                      )}
                    >
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <h3
                            className={cn(
                              "font-medium text-xs truncate transition-colors duration-500",
                              playfulMode ? "text-gray-900 font-semibold" : "text-white"
                            )}
                          >
                            {track.name}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                          href={track.bandcampUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "p-1 rounded-sm transition-all duration-300",
                            playfulMode
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500"
                              : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                          )}
                          title="Search on Bandcamp"
                        >
                          <Radio className="h-3 w-3 text-white" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700 h-full flex items-center justify-center"
                style={{
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.3),
                    inset 0 1px 0 rgba(255,255,255,0.05),
                    inset 0 -1px 0 rgba(0,0,0,0.2)
                  `,
                  background: 'linear-gradient(135deg, rgba(63,63,70,0.5) 0%, rgba(39,39,42,0.5) 100%)'
                }}
              >
                <div className="text-center text-zinc-400 p-6">
                  {isProcessing && !isAnalyzing && reasoning ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-red-500 mx-auto mb-3"
                        style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' }}
                      ></div>
                      <h3 className="text-base font-medium mb-2 tracking-wide">CREATING PLAYLIST...</h3>
                      <p className="text-sm">AI is curating your personalized metal music recommendations.</p>
                    </>
                  ) : (
                    <>
                      <Music className="h-12 w-12 mx-auto mb-3 text-zinc-600" />
                      <h3 className="text-base font-medium mb-2 tracking-wide">CURATED PLAYLIST</h3>
                      <p className="text-sm">Complete the analysis to get your personalized metal music recommendations.</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>



      </div>
    </div>
  );
}
