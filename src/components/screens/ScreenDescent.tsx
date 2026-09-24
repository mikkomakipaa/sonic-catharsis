'use client';

import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Stage, EASE } from '@/lib/theme';
import { Playlist } from '@/types';
import ResultsPanel from '@/components/panels/ResultsPanel';
import StageHeader from '@/components/StageHeader';
import DescentRail from '@/components/DescentRail';

interface ScreenDescentProps {
  stage: Stage;
  triggerLabel: string | null;
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
  triggerLabel,
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
      <div className="flex flex-col gap-1.5 max-[480px]:gap-1">
        <StageHeader stage={stage} align="left" />

        <DescentRail activeIndex={stage.index} />
      </div>

      {/* The prescription — a single column now that the receipt is gone,
          same card-free treatment and left edge as the Diagnosis screen
          above it (no centering wrapper here, same as ScreenAnalysis —
          both screens share this exact max-w-3xl column). */}
      <div className={`mt-6${playlist ? ' mt-7 max-[480px]:mt-5' : ''}`}>
        <ResultsPanel
          playlist={playlist}
          isProcessing={isProcessing}
          isAnalyzing={isAnalyzing}
          reasoning={reasoning}
          triggerLabel={triggerLabel}
          stage={stage}
          subgenre={subgenre}
        />
      </div>

      {playlist && (
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide transition-colors duration-200"
            style={{ letterSpacing: '0.05em', color: '#5c584f', transition: `color 0.2s ${EASE}` }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3b33')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5c584f')}
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
