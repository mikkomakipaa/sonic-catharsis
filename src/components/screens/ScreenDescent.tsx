'use client';

import { Dialog, DialogPanel } from '@headlessui/react';
import { useState } from 'react';
import { RefreshCw, ArrowLeft, X } from 'lucide-react';
import { Stage, EASE } from '@/lib/theme';
import { Playlist, TriggerSelection } from '@/types';
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

      {/* The prescription — a single column now that the receipt is gone,
          same card-free treatment and left edge as the Diagnosis screen
          above it (no centering wrapper here, same as ScreenAnalysis —
          both screens share this exact max-w-3xl column). Tighter gap to
          the rail once there's a result — the rail and the prescription
          it produced are related, not two detached blocks. */}
      <div className={`mt-6${playlist ? ' mt-5' : ''}`}>
        <ResultsPanel
          playlist={playlist}
          isProcessing={isProcessing}
          isAnalyzing={isAnalyzing}
          reasoning={reasoning}
          triggerLabel={triggerLabel}
          stage={stage}
          subgenre={subgenre}
          onViewReceipt={playlist && selection ? () => setShowReceipt(true) : undefined}
        />
      </div>

      {playlist && selection && (
        <Dialog open={showReceipt} onClose={setShowReceipt} className="relative z-50">
          <div className="fixed inset-0 bg-[#241a17]/45" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
            <DialogPanel className="w-full max-w-sm rounded-lg bg-[#f7f5f0] p-5 shadow-[0_16px_48px_rgba(36,26,23,0.28)]">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={() => setShowReceipt(false)} aria-label="Close receipt" className="flex h-11 w-11 items-center justify-center rounded-md" style={{ color: '#5c584f' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ReceiptCard stage={stage} triggerLabel={triggerLabel ?? 'unknown'} stressLevel={selection.intensity} subgenre={subgenre} />
            </DialogPanel>
          </div>
        </Dialog>
      )}

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
