'use client';

import { useState } from 'react';
import { RefreshCw, ArrowLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Stage, EASE } from '@/lib/theme';
import { TriggerSelection, Playlist } from '@/types';
import ResultsPanel from '@/components/panels/ResultsPanel';
import StageHeader from '@/components/StageHeader';
import DescentRail from '@/components/DescentRail';
import ReceiptCard from '@/components/ReceiptCard';

interface ScreenDescentProps {
  stage: Stage;
  selection: TriggerSelection | null;
  triggerLabel: string | null;
  playlist: Playlist | null;
  isProcessing: boolean;
  isAnalyzing: boolean;
  reasoning: string | null;
  subgenre: string | null;
  loadingMessage: string;
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
  loadingMessage,
  onReset,
  onBack,
}: ScreenDescentProps) {
  // Receipt starts collapsed on mobile — the prescription is the payoff of
  // the whole interaction and should dominate the screen there; the
  // receipt becomes a secondary, opt-in object behind a toggle. On desktop
  // (sm: and up) the `sm:!block` override below always shows it, matching
  // the side-by-side layout that already works well at that width.
  const [showReceipt, setShowReceipt] = useState(false);

  return (
    <div className="flex flex-col max-w-3xl mx-auto animate-[rite-reveal_0.6s_cubic-bezier(0.25,1,0.5,1)_both]">
      {/* Same header cluster as the analysis screen — same left axis — so
          this reads as a continuation of the same descent, not a separate
          results page. Identity + rail grouped as one connected system. */}
      <div className="flex flex-col gap-1.5 max-[480px]:gap-1">
        <StageHeader stage={stage} align="left" />

        <DescentRail activeIndex={stage.index} />
      </div>

      {/* Diagnosis and its prescription, side by side — one physical set of
          paper handed over together, not two disconnected panels. Both
          sheets start at the same top edge. */}
      <div className={cn('flex flex-col sm:flex-row sm:items-start justify-center gap-8 mt-6', playlist && 'mt-7 max-[480px]:mt-5')}>
        <ResultsPanel
          playlist={playlist}
          isProcessing={isProcessing}
          isAnalyzing={isAnalyzing}
          reasoning={reasoning}
          triggerLabel={triggerLabel}
          stage={stage}
          loadingMessage={loadingMessage}
        />

        {/* sm:contents keeps this wrapper from becoming its own flex item —
            its children (the mobile-only toggle, and the receipt itself)
            participate directly in the row above at desktop widths, same
            as when ReceiptCard was a direct child. */}
        {playlist && selection && (
          <div className="flex flex-col items-center gap-3 sm:contents">
            <button
              onClick={() => setShowReceipt((v) => !v)}
              className="sm:hidden flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide transition-colors duration-200"
              style={{ letterSpacing: '0.05em', color: '#5c584f', transition: `color 0.2s ${EASE}` }}
            >
              {showReceipt ? 'Hide Diagnostic Receipt' : 'View Diagnostic Receipt'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', showReceipt && 'rotate-180')} />
            </button>
            <div className={cn(showReceipt ? 'block' : 'hidden', 'sm:!block')}>
              <ReceiptCard
                stage={stage}
                triggerLabel={triggerLabel ?? 'unknown'}
                stressLevel={selection.intensity}
                subgenre={subgenre}
              />
            </div>
          </div>
        )}
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
