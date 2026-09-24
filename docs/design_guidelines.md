# Design Guidelines

**Last Updated:** 2026-09-23
**Status:** Source of truth for all Sonic Catharsis UI. From this point on, every page and component must be built from the tokens and components defined here — don't invent a new one-off color, weight, spacing value, or card treatment when an existing element already covers the job.

---

## Design Philosophy

**Deadpan clinical satire on warm paper.**

The app plays a real "intake → diagnosis → prescription" medical process completely straight — restrained, Nordic-paper, editorial — while the actual content (Finnish "vitutus" stages, invented metal micro-genres, a prescription pad of death metal bands) is absurd. The comedy comes entirely from the contrast between a *quiet, credible* interface and *ridiculous* content. This means:

- **The UI never winks.** No cartoonish icons, no neon, no skulls/black-metal imagery. The restraint is what makes the joke land.
- **Paper, not screens.** The three "document" surfaces (Epicrisis, Prescription, Receipt) read as real physical objects — warm off-white paper tones, hairline rules, typewriter/monospace fonts — dropped into an otherwise plain page.
- **One accent color at a time.** The page itself is neutral ink-on-cream; color is reserved for the active Stage (rail dot, header) and the CTA's coral text. Don't add decorative color anywhere else.

---

## Design System Contract

1. **Reuse tokens, don't restate values.** Colors, weights, easing, and stage/intensity data live in `src/lib/theme.ts`. Import them; don't hardcode a hex or `cubic-bezier` string that already exists there.
2. **Question vs. answer weight is deliberate.** Section headers (questions) are heavier/darker than the options below them (answers). Don't equalize them "for consistency" — see Typography.
3. **`max-[480px]:` is this app's mobile breakpoint**, not Tailwind's default `sm:` (640px). The one exception is the descent screen's prescription/receipt layout, which intentionally uses `sm:flex-row` for the desktop two-column reveal — don't add a third breakpoint convention.
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

### Paper-document palettes
Each of the three document cards has its own slightly different paper tone — this variation is intentional (they're "different sheets"), don't unify them into one shared constant:

| Card | Background | Ink | Secondary ink | Accent |
|---|---|---|---|---|
| Epicrisis (`ScreenAnalysis.tsx`) | `#f6f3ea` | `#2b2a26` | `#4a473f` | steel `#8a8577`, coral `#bd5d4c` |
| Prescription (`ResultsPanel.tsx`) | `#e8e4d8` | `#2a2a28` | muted `#6b6b66` / `#4a4a46` (mobile) | ℞ red `#7f1d1d` |
| Receipt (`ReceiptCard.tsx`, SVG) | `#e8e4d8` | `#2a2a28` | muted `#6b6b66` | — |

**Rule:** color communicates meaning (stage severity, intensity), never decoration. If you're adding color and can't say what it means, don't add it.

---

## Typography

### Fonts (`layout.tsx`)
```
--font-geist-sans        UI body text, incident textarea
--font-plex-sans         Epicrisis card body
--font-plex-mono         Epicrisis card body (secondary use)
--font-special-elite     Typewriter headings (Epicrisis, Prescription/Receipt document titles)
'Courier New', monospace Prescription + Receipt body — inline, not a next/font var
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
// src/lib/theme.ts
export const SECTION_LABEL_STYLE = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: TEXT_SECONDARY,
};
```
Rendered via the `SectionLabel` component (`StateOfMindPanel.tsx`) for all three landing-page questions ("What petty injustice...", "What kind of bullshit...", "How bad is it?"). **Any new question-style header on any screen must use this same token/component** — don't hand-roll a fourth near-identical eyebrow style.

### Document/paper card type
Document headings use `var(--font-special-elite)` monospace, uppercase, letter-spacing ~0.04–0.08em. Body copy inside documents sits at 13–16px depending on card and viewport (see each component) — the floor is **13px on mobile**, never smaller, since these are real reading content (cause/choice text, band names), not micro-labels.

---

## Spacing & Layout

- **Page container:** `container mx-auto px-6 max-[480px]:px-4 pt-8 pb-4 max-w-7xl` (`page.tsx`) wraps every screen — don't add a competing outer container.
- **Screen width:** each screen's own root is `max-w-3xl mx-auto` (selection, analysis, descent) — keep new screens on this same cap unless there's a specific reason to go wider (the descent screen's prescription card is the one deliberate exception, capped at 440px mobile / 384px desktop, see Components below).
- **Vertical rhythm:** `gap-1.5`/`max-[480px]:gap-1` between a stage header and its rail (tight — reads as one combined unit); `mt-6`–`mt-8` between major sections; `gap-3`/`gap-2.5` inside compact clusters (intensity readout, buttons).
- **Radius:** `rounded-md`/`rounded-lg` for buttons and inputs, `rounded-sm` for document cards. No `rounded-xl`/`rounded-2xl` anywhere in this app — the paper-and-ink aesthetic reads as crisper with tighter corners than a typical rounded card UI.
- **Touch targets:** 44px minimum (`min-h-[44px]`, or an invisible larger hit-area around a smaller visible control — see IntensitySlider and the Bandcamp link icon).

---

## Components

Use these; don't create parallel versions.

**SectionLabel** (`StateOfMindPanel.tsx`) — the landing page's shared question-header component. `as="label" | "p"`, renders `SECTION_LABEL_STYLE`.

**StageHeader + DescentRail** (`StageHeader.tsx`, `DescentRail.tsx`) — always rendered together as one unit (`gap-1.5`/`gap-1`), never separately. Roman numeral (`text-[36px] max-[480px]:text-[44px]`) + stage name (`text-2xl max-[480px]:text-[26px]`, bold, uppercase) on the left; the 10-dot rail below, always fits its container width (no horizontal scroll — every dot must be visible at any viewport). The active dot's own name is **not** repeated in the rail (that was tried and removed as duplication with the header above).

**ClassificationGrid** — the 3×3 (2×N mobile) trigger picker. Whole cell is the click target (`min-h-[44px]`, `py-2` compact padding), custom thin-line checkmark (never the OS checkbox), selected state = amber background tint (`rgba(201,138,75,0.08)`) + darker text, no weight change between selected/unselected (both 500). **Single-select** (`role="radiogroup"`) — for a multi-select version of the same visual pattern, see SymptomChecklist below.

**IntensitySlider** — only ever mounts once a category is selected (see Progressive Disclosure below); no "disabled" visual state exists for it. Discrete 0–9 dial + a hidden "ELEVEN" zone past the track's right edge. The readout label (`X/10`, or the Finnish tier name for `fi-*` locales) always uses `TEXT_PRIMARY`, never the tier's own ramp color — the bar/dots/handle carry the tier color, the label just needs to stay legible at every tier (some ramp colors, e.g. light green/yellow, are low-contrast for text).

**SymptomChecklist** (`SymptomChecklist.tsx`) — same thin-line-checkbox cell pattern as ClassificationGrid (same padding, checkbox, selected-tint styling), but **multi-select** (`role="group"` of real checkboxes, toggling membership in an array) and a fixed 2-column grid at every width instead of ClassificationGrid's 3-to-2 responsive reflow. Optional — never blocks `canSubmit`. Backs the "Any physical symptoms?" step; vocabulary lives in `lib/symptoms.ts` (real items from the same Vitutus study already cited elsewhere in the app, each with an English label + a Finnish `labelFi` used as the button's `title` tooltip). Not just decorative — its selection count feeds `getActiveStage()`'s severity blend (10% weight), see `docs/formulas.md`.

**DurationSelect** (`DurationSelect.tsx`) — single-select **ordinal** control, distinct from both patterns above: not a checkbox grid (that implies unordered/multi-select categories), a compact row of 5 pills instead, since duration is a progression like intensity, not a category set. Optional, defaults to "Fresh," never blocks `canSubmit`. Backs the "How long has it been festering?" step; vocabulary lives in `lib/duration.ts` — labels are stylized (Fresh → Simmering → Stewing → Overnight → Now a lifestyle), not literal time ranges, matching the app's deadpan-clinical voice. Also feeds `getActiveStage()`'s severity blend (5% weight, smallest of the three inputs), see `docs/formulas.md`.

**CassetteLoader** (`CassetteLoader.tsx`) — the loading-state hero element, not a decorative icon: `aspect-[3/2]`, sized `w-4/5` (capped `max-w-[280px]`) on mobile so it scales to whichever container it's in, fixed `220px` on desktop; spinning reels + draining tape, a bold monospace label (`label` prop, defaults to `"GOREWINTER"`; `ResultsPanel.tsx`'s "Almost there" state passes `"INEARTHED"` so the two loading moments read as distinct releases, not a repeated asset). See Loading States below for the no-background-box rule shared by both usages.

**Document cards** — three variants, each self-contained:
- **Epicrisis** (`ScreenAnalysis.tsx`): cause/choice diagnosis text, paper `#f6f3ea`.
- **Prescription** (`ResultsPanel.tsx`): centered "PRESCRIPTION" title with the ℞ glyph pinned to its own corner (absolute-positioned so it doesn't skew centering), then patient/condition/sig metadata and the 10-band list. Mobile width `max-w-[440px]`, desktop `sm:max-w-sm` (matches the receipt in the two-column layout).
- **Receipt** (`ReceiptCard.tsx`, pure SVG): centered "RECEIPT" title, itemized lines, QR citation. Starts collapsed behind a "View Diagnostic Receipt" toggle on mobile (`sm:hidden`), always visible on desktop (`sm:!block`) — this collapse pattern is the one to reuse for any future secondary/optional content block, not a new accordion component.

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

Apply this same principle to any future multi-step input: don't show a disabled control for a step that isn't reachable yet — don't render it at all until it's reachable.

---

## Loading States

There are two cassette-loader moments in the app (the analysis screen's own full-screen loading state, and `ResultsPanel`'s "Almost there" state while the curator call is in flight) — **both are plain, no background/border box.** `ScreenAnalysis.tsx`'s loading state was always plain; `ResultsPanel.tsx`'s used to sit inside a `bg-[#f2efe7] border` box, which made the two loading moments read as two different treatments depending on which screen you were on. Fixed by removing the box, not by adding one to the other — a loading state is a transient, content-free moment; it doesn't need card chrome.

**Rule:** any future loading state reuses this plain treatment (centered column, no card wrapper) unless there's a specific reason a given screen's loading state needs to look like a document/card (none currently do).

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
- **iOS zoom-on-focus:** any text input must compute to ≥16px font-size on mobile (the incident textarea is `text-sm max-[480px]:text-base` specifically for this) — going under 16px reintroduces the "zooms in and won't zoom back out" bug.
- **Placeholders clear on focus**, not just once typing starts (see the incident textarea) — instructional copy shouldn't crowd a field the user has already tapped into.

---

## Anti-patterns (don't do these)

- ❌ A fourth font-weight beyond 400/500/600/700, or 700 anywhere outside a `SectionLabel`-style question header.
- ❌ A new rounded-corner radius outside `rounded-sm`/`rounded-md`/`rounded-lg`.
- ❌ Decorative color with no semantic meaning (mode, stage, intensity).
- ❌ A disabled-looking control rendered before its step is actually reachable — hide it instead (see Progressive Disclosure).
- ❌ `overflow-x-auto`/horizontal scroll as a fix for content that doesn't fit — fix the sizing/wrapping instead (this exact mistake shipped once on the DescentRail and had to be reverted).
- ❌ Skulls, neon, gradients, or any "obviously metal" visual cliché in the UI chrome — the restraint against the absurd content is the entire joke.
