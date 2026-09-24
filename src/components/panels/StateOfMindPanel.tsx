'use client';

import { useState, type ReactNode } from 'react';
import { ArrowDownToLine, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EASE,
  CTA_BACKGROUND,
  CTA_SHADOW,
  CTA_TEXT_SHADOW,
  CTA_TEXT_COLOR,
  SECTION_LABEL_STYLE,
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  DIVIDER_COLOR,
  TREATMENT_ACCENT_BORDER,
} from '@/lib/theme';
import { TriggerSelection, PhysicalSymptomType, DurationType } from '@/types';
import ClassificationGrid from '@/components/ClassificationGrid';
import IntensitySlider from '@/components/IntensitySlider';
import SymptomChecklist from '@/components/SymptomChecklist';
import DurationSelect from '@/components/DurationSelect';

interface StateOfMindPanelProps {
  selection: TriggerSelection | null;
  onSelectionChange: (selection: TriggerSelection | null) => void;
  incidentText: string;
  onIncidentTextChange: (value: string) => void;
  symptoms: PhysicalSymptomType[];
  onSymptomsChange: (symptoms: PhysicalSymptomType[]) => void;
  duration: DurationType;
  onDurationChange: (duration: DurationType) => void;
  isProcessing: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

// Single shared style for all three "question eyebrow" headers on this
// screen — see SECTION_LABEL_STYLE in theme.ts. Renders identically for the
// incident label, classification prompt, and intensity prompt instead of
// three separately-tuned inline styles. `as="label"` keeps the incident
// header as a real <label> (kept for the existing accessibility intent)
// while the other two stay plain <p> eyebrows.
function SectionLabel({ children, className, as = 'p', htmlFor }: { children: ReactNode; className?: string; as?: 'p' | 'label'; htmlFor?: string }) {
  const Tag = as;
  return (
    <Tag className={cn('text-center uppercase max-[640px]:!text-[17px]', className)} style={SECTION_LABEL_STYLE} htmlFor={htmlFor}>
      {children}
    </Tag>
  );
}

// Situation-first flow: incident (language) -> trigger (visual
// classification) -> intensity (magnitude). The optional incident gives the
// diagnosis personal context, without competing visually with classification.
//
// Progressive disclosure: the intensity section and the submit/reset
// buttons only mount once a category is picked. Showing a disabled slider
// and a disabled "Begin Diagnosis" button before there's anything to submit
// read as an unfinished form rather than a form that isn't done yet.
export default function StateOfMindPanel({
  selection,
  onSelectionChange,
  incidentText,
  onIncidentTextChange,
  symptoms,
  onSymptomsChange,
  duration,
  onDurationChange,
  isProcessing,
  canSubmit,
  onSubmit,
  onReset,
}: StateOfMindPanelProps) {
  const showReset = Boolean(selection || incidentText);
  const [isIncidentFocused, setIsIncidentFocused] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* The incident stays first because it personalizes the diagnosis, but
          uses a compact field so classification remains the visual focus. */}
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center">
          <SectionLabel as="label" htmlFor="incident" className="mb-0.5">
            What petty injustice did you endure today?
          </SectionLabel>
          <p id="incident-optional" className="mb-1.5 text-[9px] max-[640px]:text-[14px] uppercase tracking-[0.1em]" style={{ color: TEXT_TERTIARY }}>
            Optional
          </p>
          <textarea
            id="incident"
            value={incidentText}
            onChange={(e) => onIncidentTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) onSubmit();
              }
            }}
            onFocus={() => setIsIncidentFocused(true)}
            onBlur={() => setIsIncidentFocused(false)}
            aria-describedby="incident-optional"
            // Cleared on focus, not just on typing — the placeholder is
            // instructional copy for the empty state, not something that
            // should still crowd the box once the user has tapped in.
            placeholder={isIncidentFocused ? '' : 'Describe the incident. Briefly.'}
            // text-sm (14px) is below iOS Safari's 16px auto-zoom threshold
            // for focused text inputs — it zooms in on focus and doesn't
            // zoom back out on blur. max-[480px]:text-base keeps this at
            // 16px on the phone widths where that kicks in, leaving desktop
            // typography untouched.
            className="w-full h-14 px-2 py-1 text-sm max-[640px]:text-[19px] text-center resize-none focus:outline-none transition-colors duration-200 font-normal placeholder-[#726c5d] max-[480px]:placeholder:opacity-55"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              lineHeight: '1.4',
              color: TEXT_PRIMARY,
              borderBottom: `1px solid ${isIncidentFocused ? TREATMENT_ACCENT_BORDER : DIVIDER_COLOR}`,
              transition: `border-color 0.2s ${EASE}`,
            }}
          />
        </div>
      </div>

      {/* Classification — what kind of frustration this is. A 3x3 checkbox
          matrix, the visual centerpiece of the page; no separate "trigger"
          label needed, the question above the grid already explains the
          control. */}
      <SectionLabel className="mt-8 max-[480px]:mt-5">What kind of bullshit was it?</SectionLabel>
      <div className="mt-4 w-full">
        <ClassificationGrid selection={selection} onSelectionChange={onSelectionChange} />
      </div>

      {/* Only shown before a category is picked — once selected, the next
          section takes over as guidance and this would just be clutter. */}
      {!selection && (
        <p className="text-center mt-3 text-[11px] max-[640px]:text-[15px]" style={{ color: TEXT_TERTIARY }}>
          Pick the closest one. Clinical accuracy is not required.
        </p>
      )}

      {/* Intensity + submit only reveal once a category exists — nothing
          to dial in or submit before then. */}
      {selection && (
        <div className="flex flex-col items-center animate-[rite-reveal_0.4s_cubic-bezier(0.25,1,0.5,1)_both]">
          {/* Intensity — how strongly it's affecting them. Quieter and more
              compact than the trigger grid above; a separate, independent
              axis, not a proxy for which trigger was picked. */}
          <SectionLabel className="mt-5">How bad is it?</SectionLabel>
          <div className="mt-2">
            <IntensitySlider
              value={selection.intensity}
              onChange={(tier) => onSelectionChange({ ...selection, intensity: tier })}
            />
          </div>

          {/* Physical symptoms — optional, multi-select, real items from the
              same study the app already cites elsewhere (see
              lib/symptoms.ts). Purely additional flavor for the Matcher;
              never blocks submission either way. */}
          <SectionLabel className="mt-6">Any physical symptoms?</SectionLabel>
          <p className="text-center mt-1 text-[11px] max-[640px]:text-[15px]" style={{ color: TEXT_TERTIARY }}>
            Optional. Select any that apply.
          </p>
          <div className="mt-3 w-full">
            <SymptomChecklist selected={symptoms} onSelectedChange={onSymptomsChange} />
          </div>

          {/* Duration/persistence — optional, single-select, ordinal (a
              small dial like intensity, not a category picker like the
              checklist above). See lib/duration.ts. */}
          <SectionLabel className="mt-6">How long has it been festering?</SectionLabel>
          <div className="mt-3 w-full">
            <DurationSelect value={duration} onChange={onDurationChange} />
          </div>

          <div className="mt-6">
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={cn(
                "px-10 py-4 font-semibold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 rounded-lg active:scale-[0.98]",
                canSubmit ? undefined : "cursor-not-allowed"
              )}
              style={{
                transition: `all 0.2s ${EASE}`,
                letterSpacing: '0.08em',
                background: canSubmit ? CTA_BACKGROUND : '#f2efe7',
                color: canSubmit ? CTA_TEXT_COLOR : '#5c584f',
                border: canSubmit ? 'none' : '1px solid #e6e2d8',
                boxShadow: canSubmit ? CTA_SHADOW : 'none',
                textShadow: canSubmit ? CTA_TEXT_SHADOW : undefined,
              }}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-4 w-4" />
                  <span>Begin Diagnosis</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Independent of the reveal above — stays available whenever there's
          any input to clear, even just typed text with no category picked
          yet, not only once the submit button exists. */}
      {showReset && (
        <button
          onClick={onReset}
          className="mt-6 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide transition-colors duration-200"
          style={{ letterSpacing: '0.05em', color: '#5c584f', transition: `color 0.2s ${EASE}` }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3b33')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#5c584f')}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      )}
    </div>
  );
}
