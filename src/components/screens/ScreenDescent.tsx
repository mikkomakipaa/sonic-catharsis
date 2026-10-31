'use client';

import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Stage, EASE } from '@/lib/theme';
import { Playlist, TriggerSelection } from '@/types';
import ResultsPanel from '@/components/panels/ResultsPanel';

interface ScreenDescentProps {
  stage: Stage;
  selection: TriggerSelection | null;
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
  selection,
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
      {/* Prescription is an issued record, not another diagnosis screen:
          severity remains in its compact metadata block, leaving the title
          and artist list at the top of the document. */}
      <ResultsPanel
        playlist={playlist}
        isProcessing={isProcessing}
        isAnalyzing={isAnalyzing}
        reasoning={reasoning}
        triggerLabel={triggerLabel}
        stage={stage}
        subgenre={subgenre}
        intensity={selection?.intensity}
      />

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
            Back to Diagnosis
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
