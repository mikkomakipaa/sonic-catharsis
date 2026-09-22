'use client';

import { EmotionWheelSelection } from '@/types';
import StateOfMindPanel from '@/components/panels/StateOfMindPanel';

interface ScreenSelectionProps {
  primarySelection: EmotionWheelSelection | null;
  onPrimarySelectionChange: (selection: EmotionWheelSelection | null) => void;
  eventDescription: string;
  onEventDescriptionChange: (value: string) => void;
  isProcessing: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

export default function ScreenSelection(props: ScreenSelectionProps) {
  return (
    <div className="max-w-3xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      <StateOfMindPanel
        primarySelection={props.primarySelection}
        onPrimarySelectionChange={props.onPrimarySelectionChange}
        eventDescription={props.eventDescription}
        onEventDescriptionChange={props.onEventDescriptionChange}
        isProcessing={props.isProcessing}
        canSubmit={props.canSubmit}
        onSubmit={props.onSubmit}
        onReset={props.onReset}
      />
    </div>
  );
}
