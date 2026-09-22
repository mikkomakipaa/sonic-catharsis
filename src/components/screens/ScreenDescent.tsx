'use client';

import { RefreshCw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Stage, EASE } from '@/lib/theme';
import { EmotionWheelSelection, Playlist } from '@/types';
import ResultsPanel from '@/components/panels/ResultsPanel';
import StageHeader from '@/components/StageHeader';
import DescentRail from '@/components/DescentRail';
import ReceiptCard from '@/components/ReceiptCard';

interface ScreenDescentProps {
  stage: Stage;
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
  stage,
  primarySelection,
  playlist,
  isProcessing,
  isAnalyzing,
  reasoning,
  subgenre,
  onReset,
  onBack,
}: ScreenDescentProps) {
  return (
    <div className="flex flex-col max-w-3xl mx-auto animate-[rite-reveal_0.6s_cubic-bezier(0.25,1,0.5,1)_both]">
      {/* Same header cluster as the analysis screen — same left axis — so
          this reads as a continuation of the same descent, not a separate
          results page. Identity + rail grouped as one connected system. */}
      <div className="flex flex-col gap-3">
        <StageHeader stage={stage} align="left" />

        <DescentRail activeIndex={stage.index} />
      </div>

      {playlist && (
        <p
          className="text-center uppercase mt-7 mb-3"
          style={{ fontSize: 10.5, letterSpacing: '0.14em', color: '#a6a297', fontWeight: 600 }}
        >
          Prescribed Treatment
        </p>
      )}

      {/* Diagnosis and its prescription, side by side — one physical set of
          paper handed over together, not two disconnected panels. Both
          sheets start at the same top edge. */}
      <div className={cn('flex flex-col sm:flex-row sm:items-start justify-center gap-8', !playlist && 'mt-6')}>
        <ResultsPanel
          playlist={playlist}
          isProcessing={isProcessing}
          isAnalyzing={isAnalyzing}
          reasoning={reasoning}
          emotion={primarySelection?.emotion}
          stage={stage}
        />

        {playlist && primarySelection && (
          <ReceiptCard
            stage={stage}
            emotion={primarySelection.emotion}
            stressLevel={primarySelection.stressLevel}
            subgenre={subgenre}
          />
        )}
      </div>

      {playlist && (
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide transition-colors duration-200"
            style={{ letterSpacing: '0.05em', color: '#a6a297', transition: `color 0.2s ${EASE}` }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#726f66')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#a6a297')}
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Analysis
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide transition-colors duration-200"
            style={{ letterSpacing: '0.05em', color: '#bd5d4c', transition: `color 0.2s ${EASE}` }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#a3493a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#bd5d4c')}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Begin Again
          </button>
        </div>
      )}
    </div>
  );
}
