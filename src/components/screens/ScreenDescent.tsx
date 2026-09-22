'use client';

import { RefreshCw, ArrowLeft } from 'lucide-react';
import { calculateDamageScore, Circle, EASE } from '@/lib/theme';
import { EmotionWheelSelection, Playlist } from '@/types';
import ResultsPanel from '@/components/panels/ResultsPanel';
import CircleHeader from '@/components/CircleHeader';
import DescentRail from '@/components/DescentRail';
import ReceiptCard from '@/components/ReceiptCard';

interface ScreenDescentProps {
  circle: Circle;
  primarySelection: EmotionWheelSelection | null;
  playlist: Playlist | null;
  isProcessing: boolean;
  isAnalyzing: boolean;
  reasoning: string | null;
  subgenre: string | null;
  onReset: () => void;
  onBack: () => void;
}

export default function ScreenDescent({
  circle,
  primarySelection,
  playlist,
  isProcessing,
  isAnalyzing,
  reasoning,
  subgenre,
  onReset,
  onBack,
}: ScreenDescentProps) {
  const damageScore = primarySelection ? calculateDamageScore(primarySelection.emotion, primarySelection.stressLevel) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto animate-[rite-reveal_0.6s_cubic-bezier(0.25,1,0.5,1)_both]">
      {/* Same header cluster as the analysis screen — same left axis, same
          Emotional Damage placement — so this reads as a continuation of
          the same descent, not a separate results page. */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-x-4 gap-y-3 max-w-xl">
        <CircleHeader circle={circle} align="left" />
        {primarySelection && (
          <div className="justify-self-start sm:justify-self-end text-left sm:text-right">
            <span className="text-xs font-semibold uppercase tracking-wide text-red-400" style={{ letterSpacing: '0.08em' }}>
              Emotional Damage
            </span>
            <div className="text-4xl font-bold font-mono tabular-nums text-red-500 mt-1">
              {damageScore}
              <span className="text-sm opacity-60 ml-1">/1000</span>
            </div>
          </div>
        )}
      </div>

      <DescentRail activeIndex={circle.index} />

      {/* Diagnosis and its prescription, side by side — one physical set of
          paper handed over together, not two disconnected panels. */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-center gap-8">
        <ResultsPanel
          playlist={playlist}
          isProcessing={isProcessing}
          isAnalyzing={isAnalyzing}
          reasoning={reasoning}
          emotion={primarySelection?.emotion}
          circle={circle}
        />

        {playlist && primarySelection && (
          <ReceiptCard
            circle={circle}
            emotion={primarySelection.emotion}
            stressLevel={primarySelection.stressLevel}
            damageScore={damageScore}
            subgenre={subgenre}
          />
        )}
      </div>

      {playlist && (
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
            style={{ letterSpacing: '0.05em', transition: `color 0.2s ${EASE}` }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Analysis
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-400 hover:text-red-300 transition-colors duration-200"
            style={{ letterSpacing: '0.05em', transition: `color 0.2s ${EASE}` }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Begin Again
          </button>
        </div>
      )}
    </div>
  );
}
