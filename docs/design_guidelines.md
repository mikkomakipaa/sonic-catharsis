# Design Guidelines

**Last Updated:** 2026-09-24
**Status:** Source of truth for all Sonic Catharsis UI. From this point on, every page and component must be built from the tokens and components defined here — don't invent a new one-off color, weight, spacing value, or card treatment when an existing element already covers the job.

---

## Design Philosophy

**Deadpan clinical satire on a warm plain page.**

The app plays a real "intake → diagnosis → prescription" medical process completely straight — restrained, Nordic-paper, editorial — while the actual content (Finnish "vitutus" stages, invented metal micro-genres, a prescription pad of death metal bands) is absurd. The comedy comes entirely from the contrast between a *quiet, credible* interface and *ridiculous* content. This means:

- **The UI never winks.** No cartoonish icons, no neon, no skulls/black-metal imagery. The restraint is what makes the joke land.
- **The interface plays the straight man; the copy carries the absurdity.** The whole flow — landing page *and* the post-assessment Diagnosis/Prescription screens — shares one plain-page visual system: warm off-white canvas, hairline rules, restrained typography, no borders/shadows/card chrome. The Receipt is an optional, on-demand overlay for the underlying assessment record, never a peer surface beside the Prescription. The clinical *voice* (Epicrisis, Dose Calibration, dry sig lines) stays; physical-object rendering is retired. See Components below.
- **One accent color at a time, and each color means one thing.** Severity → the active Stage's own color (`stage.color`). Treatment/action → `TREATMENT_ACCENT_*`. Completed/calibrated → `COMPLETE_ACCENT`. Don't add decorative color that isn't one of these.

---

## Design System Contract

1. **Reuse tokens, don't restate values.** Colors, weights, easing, and stage/intensity data live in `src/lib/theme.ts`. Import them; don't hardcode a hex or `cubic-bezier` string that already exists there.
2. **Question vs. answer weight is deliberate.** Section headers (questions) are heavier/darker than the options below them (answers). Don't equalize them "for consistency" — see Typography.
3. **`max-[480px]:` is this app's standard mobile layout breakpoint**, not Tailwind's default `sm:` (640px). The intake screen's mobile type scale is the intentional exception: its reading-size adjustments and trigger-grid reflow begin together at `max-[640px]`. Don't introduce other breakpoint conventions.
4. **44px minimum touch targets** on every interactive element that appears on mobile (buttons, checkboxes, slider hit-area, Bandcamp links). The visible control can be smaller than that; the tappable area cannot.
5. **No `overflow-x` surprises.** Anything that can hold long or dynamic text (stage names, band names, incident text) needs `min-w-0` on its flex-item ancestors and either wraps or truncates — it must never be allowed to push the page wider than the viewport.
6. **New UI must reuse an existing document/card/button pattern below**, not invent a new visual language. If none fits, that's a real design decision — flag it, don't silently improvise.

---

## Color

### Page shell
```
page background:  #f7f5f0   (warm cream, not pure white)
grain overlay:     2% opacity SVG noise texture, decorative only
```

### Neutral ink scale (`src/lib/theme.ts`)
Three intentional levels — pick the lowest one that's still readable, never reach for `TEXT_DECORATIVE` on real text:
```
TEXT_PRIMARY    #2f2e2b   headings, entered/selected content
TEXT_SECONDARY  #5c584f   labels, interaction text, instructions, question headers
TEXT_TERTIARY   #7d7869   de-emphasized metadata, brand kicker ("Sonic Catharsis")
TEXT_DECORATIVE #a6a297   NOT for text — divider lines, inactive dots, borders only
```

### CTA (primary button)
```
CTA_BACKGROUND   #241a17   matte deep brown-black, solid fill, no gradient
CTA_TEXT_COLOR   #e8a672   warm coral/amber
CTA_SHADOW       0 4px 14px -4px rgba(36,26,23,0.45)
```

### Stage colors (`STAGES` in theme.ts)
Each of the 9 stages (+ `SURFACE`) has its own hex, used for the rail dot, the big roman numeral, and the stage name — never override these per-component:
```
I    #71717a   II   #a855f7   III  #4d7c0f
IV   #ca8a04   V    #7f1d1d   VI   #ea580c
VII  #dc2626   VIII #a16207   IX   #7dd3fc
SURFACE (pre-selection) #52525b
```

### Intensity tiers (`STRESS_TIERS` in theme.ts)
11 tiers (0–10), a green→red ramp with ELEVEN deliberately breaking it:
```
0  #10b981   1  #22c55e   2  #84cc16   3  #eab308   4  #f97316
5  #ea580c   6  #dc2626   7  #991b1b   8  #7f1d1d   9  #581c87
ELEVEN (10)  #fbbf24   ← shock color, outside the ramp on purpose
```

### Semantic color language
Three accent tokens, each with exactly one meaning, used across both the Diagnosis and Prescription screens (`src/lib/theme.ts`):

```
severity            stage.color              the active Stage's own hex (existing STAGES data)
treatment/action     TREATMENT_ACCENT_*        #f3e2dc bg / #eed3ca hover / #c99184 border / #7a3d2e text
completed/calibrated COMPLETE_ACCENT           #6f8f7c  muted sage
divider (neutral)   DIVIDER_COLOR             #e6e2d8  hairline rules, both screens
```

- **Severity** (`stage.color`): the stage rail/header and the Diagnosis screen's "Prescribed Response" value. The Prescription metadata values (`FOR`, `SEVERITY`, and `TREATMENT`) use `TEXT_PRIMARY` so the record reads as a single, neutral clinical block.
- **Treatment/action** (`TREATMENT_ACCENT_*`): now reserved for *interactive* elements only — the "Get Prescription" CTA and the Bandcamp link ring. Not diagnostic value text (see Severity above).
- **Completed/calibrated** (`COMPLETE_ACCENT`): the checkmark and locked-row text in `DiagnosticReceipt.tsx`/`PrescriptionCalibration.tsx` once a line finishes — distinct from the vivid `STRESS_TIERS` ramp, which signals intensity, not completion.

**Rule:** color communicates meaning (severity, treatment, completion), never decoration. If you're adding color and can't map it to one of the three above (or to `STAGES`/`STRESS_TIERS`/the CTA), don't add it.

---

## Typography

### Fonts (`layout.tsx`)
```
--font-geist-sans        UI body text, incident textarea
--font-plex-sans         Diagnosis + Prescription body content (cause/choice text, band names)
--font-plex-mono         Reserved secondary use
--font-special-elite     Typewriter section eyebrows/headings (Diagnosis, Prescription, loading states)
'Courier New', monospace Clinical metadata only (FOR/SEVERITY/TREATMENT rows, band numbering, sig line) — inline, not a next/font var
--font-fraunces          Reserved for any future headline treatment
--font-shadow-prayer     Decorative display face, currently unused in shipped UI
```

### Weight scale — 400 / 500 / 600 / 700, nothing else
```
400  textarea input/placeholder text only
500  answers: category labels, intensity readout/labels, secondary buttons (Reset, Clear)
600  primary CTA ("Begin Diagnosis")
700  questions only: the three section headers, via SECTION_LABEL_STYLE
```
Question headers are deliberately heavier and darker than the answers below them — that's the hierarchy, not a bug to "fix" by matching weights.

### Section headers — one shared token, not three inline styles
```ts
// src/lib/theme.ts — desktop baseline; StateOfMindPanel raises this to 17px
// at <=640px so questions retain their hierarchy on a phone.
export const SECTION_LABEL_STYLE = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: TEXT_SECONDARY,
};
```
Rendered via the `SectionLabel` component (`StateOfMindPanel.tsx`) for all three landing-page questions ("What petty injustice...", "What kind of bullshit...", "How bad is it?"). **Any new question-style header on any screen must use this same token/component** — don't hand-roll a fourth near-identical eyebrow style.

### Diagnosis/Prescription document type
Section eyebrows and clinical metadata use `var(--font-special-elite)` monospace, uppercase, letter-spacing ~0.04–0.08em. Body copy (cause/choice text, band names) sits at 13–16px depending on screen and viewport (see each component) — the floor is **13px on mobile**, never smaller, since these are real reading content, not micro-labels.

---

## Spacing & Layout

- **Page container:** `container mx-auto px-6 max-[480px]:px-4 pt-8 pb-4 max-w-7xl` (`page.tsx`) wraps every screen — don't add a competing outer container. Epicrisis alone tightens its mobile (≤640px) top padding to `pt-4`; desktop and the Selection/Prescription entry spacing stay unchanged.
- **Screen width:** every screen's root is `max-w-3xl mx-auto` (selection, analysis, descent) — **one shared editorial grid**. The Diagnosis and Prescription screens deliberately share this exact same container (not two separately-sized columns): the stage rail, the Diagnosis header/body, and the Prescription panel all sit at the same width and the same left edge. `ResultsPanel` has no width/centering of its own — it inherits the parent's `max-w-3xl` directly, the same way `ScreenAnalysis`'s content does. Don't reintroduce a narrower or centered cap on either screen; that was tried (Prescription at `max-w-xl mx-auto`) and reverted because it made the two screens read as different templates.
- **Vertical rhythm:** `gap-1.5`/`max-[480px]:gap-1` between a stage header and its rail (tight — reads as one combined unit); `mt-6`–`mt-8` between major sections; `gap-3`/`gap-2.5` inside compact clusters (intensity readout, buttons). On Epicrisis mobile, use `mt-5` after the identifier and `mt-3`/`pt-1` before the narrative, with the first section at `mt-4`, to avoid desktop-scale blank space above the reading content.
- **Radius:** `rounded-md`/`rounded-lg` for buttons and inputs, `rounded-sm` where a small filled/bordered element still needs one (e.g. the Diagnosis screen's retry button). No `rounded-xl`/`rounded-2xl` anywhere in this app — crisper, tighter corners than a typical rounded card UI.
- **Touch targets:** 44px minimum (`min-h-[44px]`, or an invisible larger hit-area around a smaller visible control — see IntensitySlider and the Bandcamp link icon).

---

## Components

Use these; don't create parallel versions.

**SectionLabel** (`StateOfMindPanel.tsx`) — the landing page's shared question-header component. `as="label" | "p"`, renders `SECTION_LABEL_STYLE`. It's landing-page-only now: the Diagnosis and Prescription screens instead use the clinical-metadata monospace eyebrow (`var(--font-special-elite)`, `TEXT_TERTIARY`, `text-[11px]`, `letterSpacing: 0.04em`) for **every** section identifier across the whole flow — `INTAKE / CASE 001` (Intake), `CLINICAL NOTE / EPICRISIS 001`, `OBSERVATION / 01`, `TREATMENT / 02` (Diagnosis), `PRESCRIPTION / CASE 001` (Prescription) — one consistent case-file vocabulary end to end, not `SECTION_LABEL_STYLE` reused for a left-aligned variant.

**StageHeader + DescentRail** (`StageHeader.tsx`, `DescentRail.tsx`) — always rendered together as one unit (`gap-1.5`/`gap-1`), never separately. Roman numeral (`text-[36px] max-[480px]:text-[44px]`) + stage name (`text-2xl max-[480px]:text-[26px]`, bold, uppercase) on the left; the 11-dot rail below (Surface, "Level 0: Pseudo-vitutus", then I-IX — see `PSEUDO_VITUTUS_STAGE` in `theme.ts`), always fits its container width (no horizontal scroll — every dot must be visible at any viewport). The active dot's own name is **not** repeated in the rail (that was tried and removed as duplication with the header above).

**ClassificationGrid** — 8 trigger categories (no "Other Bullshit"/unclassified catch-all — every situation is expected to fit one of the eight), 3-column desktop / 2-column mobile (an even 2×4, no leftover row). Whole cell is the click target (`min-h-[44px]`, `py-2` compact padding — trimmed from `py-3` since that pushed rows well past the 44px floor once combined with the checkbox), custom thin-line checkmark (never the OS checkbox, `22px` on mobile), selected state = amber background tint (`rgba(201,138,75,0.08)`) + darker text, no weight change between selected/unselected (both 500). **Single-select** (`role="radiogroup"`) — for a multi-select version of the same visual pattern, see SymptomChecklist below.

At `<=640px`, reflow to two columns and render both trigger and symptom option labels at `13px` (symptom checkboxes stay `26px`; trigger checkboxes are `22px`, see above). This keeps the two intake checklists visually consistent while leaving the incident prompt at its Safari-safe `16px` size.

**IntensitySlider** and **DurationSelect** are sibling scales sharing one anatomy — a thin hairline track (not a filled progress bar), small hollow dots for unselected positions, a centered current-value readout above the track, and an endpoint-caption row below it (`INTOLERABLE LIGHTNESS` / `MULTI-CLIMAX` for intensity, `FRESH` / `LIFESTYLE` for duration) — rather than reading as two unrelated widgets. Intensity keeps its own distinguishing traits: a 10-step continuous-feeling dial (0–9) plus a hidden "ELEVEN" zone past the track's right edge, a numeric `N/10` readout, and per-tier fill color from a warm sand-to-espresso ramp (`STRESS_TIERS` in `theme.ts` — not the old green→red ramp, which wrongly implied "safe vs. dangerous" on a scale that measures magnitude, not goodness); Duration stays a 5-stop discrete dial with a single flat accent color and its current stage's word instead of a number. `StateOfMindPanel` wraps both in a definite `min(384px, calc(100vw - 2rem))` width (not `max-w`/percentage) — a percentage width inside these nested, centered, auto-sized flex columns resolves against an indeterminate size in Safari and gets stuck small until an unrelated sibling coincidentally establishes a real width. The readout label always uses `TEXT_PRIMARY`, never the tier's own ramp color — the dots/handle carry the tier color, the label just needs to stay legible at every tier. Both controls' interactive track has a `min-h-[44px]` hit band at every width, not just one breakpoint — a touch device isn't guaranteed to have a narrow viewport.

**SymptomChecklist** (`SymptomChecklist.tsx`) — same thin-line-checkbox cell pattern as ClassificationGrid (same mobile 13px label and 26px checkbox scale, padding, and selected tint), but **multi-select** (`role="group"` of real checkboxes, toggling membership in an array) and a fixed 2-column grid at every width instead of ClassificationGrid's 3-to-2 responsive reflow. Optional — never blocks `canSubmit`. Backs the "Any physical symptoms?" step; vocabulary lives in `lib/symptoms.ts` (real items from the same Vitutus study already cited elsewhere in the app, each with an English label + a Finnish `labelFi` used as the button's `title` tooltip). Not just decorative — its selection count feeds `getActiveStage()`'s severity blend (10% weight), see `docs/formulas.md`.

**DurationSelect** (`DurationSelect.tsx`) — single-select **ordinal** control (see the shared anatomy note above), distinct from ClassificationGrid/SymptomChecklist's checkbox-grid pattern since duration is a progression like intensity, not an unordered category set. Optional, defaults to "Fresh," never blocks `canSubmit`. Backs the "How long has it been festering?" step; vocabulary lives in `lib/duration.ts` — labels are stylized (Fresh → Simmering → Stewing → Overnight → Lifestyle), not literal time ranges, matching the app's deadpan-clinical voice. Also feeds `getActiveStage()`'s severity blend (5% weight, smallest of the three inputs), see `docs/formulas.md`.

**DiagnosticReceipt** (`DiagnosticReceipt.tsx`) — the matcher-stage loading element (`ScreenAnalysis.tsx`'s full-screen loading state, before the Epicrisis result exists). A fixed four-line checklist ("Reading emotional state" → "Measuring festering time") prints in one line at a time (`receipt-line-print` keyframe, `globals.css`, gated on `prefers-reduced-motion`), each line flipping from a pulsing `…` to `✓` as it "completes," then settles on a pulsing "Generating diagnosis…" footer until the result replaces it. Its four 400ms steps fit the shared 2.2-second minimum loading duration, leaving a final 600ms beat for the footer to remain visibly active. No `LOADING_MESSAGES`-driven copy — its checklist is a fixed printed sequence, not a random pick.

**PrescriptionCalibration** (`PrescriptionCalibration.tsx`) — the curator-stage loading element (`ResultsPanel.tsx`'s loading state while `/api/curator` is in flight, replacing the old `CassetteLoader`). Same document-typography/no-card treatment and reveal cadence as `DiagnosticReceipt`, but framed as dosage calibration: four rows (Aggression/Heaviness/Dissonance/Melody), each an 8-segment `▰`/`▱` bar that flickers to a random fill count every 120ms while "scanning," then freezes at a full bar + `✓` once its turn to lock passes. **The flicker values and the lock order are the only things that move — the bar never settles at a partial or percentage-like fill.** That's deliberate: a bar that stopped at, say, 6/8 would read as a real measurement of a value the app doesn't actually compute, undermining the "the machine is processing your input" premise the whole loading-state redesign is built on. If genre-derived values for these four axes are ever added for real, this is the screen to wire them into — not a reason to fake numbers now. Footer reads "Formulating active compounds" while scanning, then a pulsing "Preparing prescription…" once all four rows lock.

**Diagnosis and Prescription screens** — no card, no paper background, no border, no shadow. Both are plain page content, same visual register as the landing page, and both share the exact same `max-w-3xl` column and left edge (see Screen width above), but their hierarchy serves different document jobs:
- **Diagnosis** (`ScreenAnalysis.tsx`): first a tiny `CLINICAL NOTE / EPICRISIS 001` identifier, then a generous `mt-8` gap before the prominent StageHeader + DescentRail severity finding (`mt-5` on mobile ≤640px). `OBSERVATION / 01` (cause) and `TREATMENT / 02` (subgenre — colored `stage.color`, not a separate accent — + choice text) follow after a tighter `mt-5`/`pt-3` transition (`mt-3`/`pt-1`, and first narrative `mt-4`, on mobile ≤640px), separated by `DIVIDER_COLOR` hairlines, then the citation footnote and the "Get Prescription" CTA. These two eyebrows use the same clinical monospace style as the `CLINICAL NOTE / EPICRISIS 001` identifier above them (not `SECTION_LABEL_STYLE`) — "Observation" rather than "Incident Summary" since the incident was already captured at Intake and this is the system's read of it, not a repeat; "Treatment" rather than "Prescribed Response" since the actual prescription (the 10 bands) arrives on the next screen. Mobile diagnosis body copy is `16px`/`leading-[1.45]`; its response/citation/action gaps reduce to `mt-4`/`pt-3`, `mt-3`/`pt-2`, and `mt-5`, respectively, so all reading content and the CTA fit a 390×844 viewport. This establishes document type → severity → interpretation → treatment; cause and response prose must not repeat the already-displayed stage name or Roman numeral. Body copy (cause/choice) sits at `15px`/`leading-[1.45]` on desktop — bumped up from an earlier `13px` that read as too small on wider viewports; still slightly below mobile's `16px` to stay precise/editorial rather than loose.
- **Prescription** (`ResultsPanel.tsx`): no prominent StageHeader or DescentRail — severity is deliberately recorded once in its compact metadata. Start with the same clinical monospace eyebrow as the rest of the case file, `PRESCRIPTION / CASE 001` (not a bold left-aligned heading), and a quiet, right-aligned `VIEW RECEIPT` utility action. The utility action is muted `TEXT_SECONDARY` and adopts `TREATMENT_ACCENT_TEXT` only on hover; it remains a 44px touch target on mobile. Then a `FOR`/`SEVERITY`/`TREATMENT` key-value block (monospace metadata; labels in `TEXT_SECONDARY`, not `TEXT_TERTIARY` — secondary but legible; values in `TEXT_PRIMARY` so the block uses one neutral ink treatment). Then the 10-band list: numbers are small (`text-[9px]`, `TEXT_TERTIARY`) *and* rendered at `opacity: 0.6` — pure indexing metadata, not information, so they should recede further than any other text on screen; band names stay at `text-[14px]` bold sans (don't push these larger — they already carry enough weight). The Bandcamp listen icon per row stays at `opacity-40` and only reaches full opacity on hover/focus (`group-hover`/`group-focus-within` on the row) — quiet until interacted with, so it doesn't compete with the band name as a repeated coral dot down the list. Then a `DOSAGE` section with the sig line. No width/centering of its own — inherits `max-w-3xl` from `ScreenDescent`'s root, same as Diagnosis.
- **Receipt overlay** (`ReceiptCard.tsx`, opened from `ScreenDescent.tsx`): the quiet `View receipt` utility action in the Prescription header opens a dismissible overlay containing a flat clinical receipt. It exposes the recorded trigger, intensity, stage, treatment, generated timestamp, closing protocol copy, and a QR citation to the Vitutus study. It is intentionally secondary and must never render beside or below the Prescription as a competing page surface.

Typography split within these two screens: **monospace/typewriter (`'Courier New', monospace` or `var(--font-special-elite)`) is reserved for clinical metadata** (section eyebrows, the FOR/SEVERITY/TREATMENT rows, band numbering, the citation footnote) — actual content (cause/choice body text, band names) renders in the sans body font (`var(--font-plex-sans)`).

**Buttons** — two variants only:
- **Primary CTA**: solid `CTA_BACKGROUND` fill, `CTA_TEXT_COLOR` text, `rounded-lg`, weight 600, `active:scale-[0.98]`.
- **Ghost/text button** (Reset, Clear, Back): no fill, `TEXT_SECONDARY` → darker on hover, weight 500, uppercase, small letter-spacing.

There is no secondary/outline button variant beyond the "Get Prescription" call — if a new screen needs a secondary action, use the ghost pattern, not a new bordered variant.

---

## Progressive Disclosure

The landing page reveals in stages rather than showing the full form (including disabled controls) upfront:
1. Incident text + trigger grid are always visible, plus a hint line ("Pick the closest one. Clinical accuracy is not required.") shown only before a category is picked.
2. Intensity section, the optional physical-symptoms checklist, the optional duration select, and the submit button mount together (with a `rite-reveal` animation) only once a category is selected — never rendered in a disabled/placeholder state.
3. Reset stays available independent of that reveal — it must work the moment there's *any* input to clear (even just typed text, no category yet).

When the first trigger is selected, smoothly scroll the newly mounted intensity section into view (unless reduced motion is requested). Do this once per selection cycle; switching between trigger categories must not repeatedly move the viewport.

Apply this same principle to any future multi-step input: don't show a disabled control for a step that isn't reachable yet — don't render it at all until it's reachable.

---

## Loading States

Card-free document typography is the standing rule for the *entire* post-assessment flow now (see Components above) — this section was where that pattern first appeared, when it was still a loading-only exception to a paper-card Diagnosis/Prescription. It no longer is one; the two loading states below are just the transient version of the same treatment the results screens use at rest.

Both loading moments in the app are **animated diagnostic documents** — receipt/document typography (monospace, dashed hairline rules, uppercase labels), printing in line by line, but with **no card wrapper, border, or shadow**. The document itself *is* the loading object, anchored at the top of its available post-assessment column rather than vertically centered.

- **Matcher stage** (`ScreenAnalysis.tsx`'s full-screen loading state, before the Epicrisis result exists): `DiagnosticReceipt.tsx` — a four-line checklist that "prints" and checks off.
- **Curator stage** (`ResultsPanel.tsx`'s loading state while `/api/curator` is in flight): `PrescriptionCalibration.tsx` — a four-row "compound" scanner that locks each row in turn. This replaced the earlier plain `CassetteLoader` treatment so both loading moments read as one continuous ritual (assessment → calibration) instead of two unrelated widgets.

Both share the same underlying mechanics: fixed, non-random copy (not a pick from a message pool), a staggered reveal (`receipt-line-print` keyframe, `globals.css`, gated on `prefers-reduced-motion`), and a persistent pulsing footer once all rows/lines finish, so the loader never looks "done" before the actual API call resolves. Successful matcher and curator requests enforce a 2.2-second minimum from request start: four 400ms rows lock in sequence, then the footer stays active for a final 600ms beat before results can replace the loader; failures surface immediately. Loader headers and status copy use primary ink; completed lines use the high-contrast sage completion accent. The clinical restraint must not make the processing state hard to read.

**Rule for any future loading state:** if it gets this document treatment, it must (1) stay card-free — no background, border, or shadow, just text on the page, (2) anchor at the top of its available column, (3) use at least 13px text on mobile, and (4) never display an animated value that looks like a real measurement (percentage, count, fixed-but-arbitrary bar width) unless that value is actually computed. `PrescriptionCalibration`'s bars flicker at random fill counts while "scanning" specifically so they don't imply a fake per-axis score — see that component's own comment for the reasoning if you're tempted to make the bars "mean something" before the app actually computes those axes.

---

## Animation

```
EASE = cubic-bezier(0.25, 1, 0.5, 1)   // the one easing curve used everywhere
```
- **Reveal:** `animate-[rite-reveal_0.4s–0.6s_cubic-bezier(0.25,1,0.5,1)_both]` (keyframe in `globals.css`) — screen-level reveals use 0.5–0.6s, smaller in-page reveals (like the intensity section appearing) use 0.4s.
- **Micro-interactions:** `transition-all`/`transition-colors duration-200` with `EASE`, `active:scale-[0.98]` on buttons.
- **Never** animate layout-shifting properties without a reserved space first (see the loading-screen centering fix — a loader that pops in at the top with a jump to center later is a bug, not a style choice).

---

## Mobile Rules

- **Viewport meta:** `viewport-fit=cover`, `initialScale: 1`, pinch-zoom never disabled (`layout.tsx`).
- **`min-h-dvh`**, not `min-h-screen`, on the page shell — avoids Safari's toolbar collapse/expand reflowing the page.
- **iOS zoom-on-focus:** any text input must compute to ≥16px font-size on mobile (the incident textarea is `text-sm max-[640px]:text-[16px]` specifically for this) — going under 16px reintroduces the "zooms in and won't zoom back out" bug.
- **Intake reading scale:** at `<=640px`, the `SONIC CATHARSIS` wordmark is `12px`; question headings and checkbox labels are `13px`; the incident prompt is `16px` (Safari's no-zoom threshold); `OPTIONAL` is `11px`; helper copy is `12px`; and checkboxes are `26px`. Preserve the desktop values, letter spacing, colors, whitespace, and grid structure.
- **Placeholders clear on focus**, not just once typing starts (see the incident textarea) — instructional copy shouldn't crowd a field the user has already tapped into.

---

## Anti-patterns (don't do these)

- ❌ A fourth font-weight beyond 400/500/600/700, or 700 anywhere outside a `SectionLabel`-style question header.
- ❌ A new rounded-corner radius outside `rounded-sm`/`rounded-md`/`rounded-lg`.
- ❌ Decorative color with no semantic meaning (mode, stage, intensity).
- ❌ A disabled-looking control rendered before its step is actually reachable — hide it instead (see Progressive Disclosure).
- ❌ `overflow-x-auto`/horizontal scroll as a fix for content that doesn't fit — fix the sizing/wrapping instead (this exact mistake shipped once on the DescentRail and had to be reverted).
- ❌ Skulls, neon, gradients, or any "obviously metal" visual cliché in the UI chrome — the restraint against the absurd content is the entire joke.
