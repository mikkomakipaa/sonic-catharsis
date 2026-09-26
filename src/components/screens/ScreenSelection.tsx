'use client';

import { TriggerSelection, PhysicalSymptomType, DurationType } from '@/types';
import StateOfMindPanel from '@/components/panels/StateOfMindPanel';

interface ScreenSelectionProps {
  selection: TriggerSelection | null;
  onSelectionChange: (selection: TriggerSelection | null) => void;
  incidentText: string;
  onIncidentTextChange: (value: string) => void;
  symptoms: PhysicalSymptomType[];
  onSymptomsChange: (symptoms: PhysicalSymptomType[]) => void;
  duration: DurationType | null;
  onDurationChange: (duration: DurationType) => void;
  isProcessing: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

export default function ScreenSelection(props: ScreenSelectionProps) {
  return (
    <div className="max-w-3xl mx-auto animate-[rite-reveal_0.5s_cubic-bezier(0.25,1,0.5,1)_both]">
      <StateOfMindPanel
        selection={props.selection}
        onSelectionChange={props.onSelectionChange}
        incidentText={props.incidentText}
        onIncidentTextChange={props.onIncidentTextChange}
        symptoms={props.symptoms}
        onSymptomsChange={props.onSymptomsChange}
        duration={props.duration}
        onDurationChange={props.onDurationChange}
        isProcessing={props.isProcessing}
        canSubmit={props.canSubmit}
        onSubmit={props.onSubmit}
        onReset={props.onReset}
      />
    </div>
  );
}
