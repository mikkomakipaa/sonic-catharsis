# Sonic Catharsis emotional model

Reference spec for the app's emotion/intensity/stage system. Kept here as a
single source of truth for future edits to `lib/theme.ts`, `lib/prompts.ts`,
or `lib/genre-mapping.ts` — not injected into the live matcher/curator
prompts, since most of this is repo-level context the model never needs to
act on. Pull in a specific line only if the model is observed getting that
exact thing wrong.

- Each session has:
  - emotion (1 of Plutchik's 8: joy, trust, fear, surprise, sadness, disgust, anger, anticipation)
  - intensity (1–10, plus a hidden 11th tier reached only by dragging the slider past its end — displayed as 11/10, deliberately breaking the printed scale)
  - trigger_text (freeform event description — "What exactly ruined an otherwise perfectly acceptable day?")
  - stage (I–IX, derived deterministically from emotion + intensity, see below)

- Stage terminology is loosely inspired by the Finnish "Vitutus" study
  (emotion.utu.fi, LN_JH_Vitutus_22.pdf, cited via QR on every receipt).
  The study explicitly uses terms including perusvitutus (III),
  keskivaikea vitutus (IV), syvävitutus (VI), and vitutus maximus (IX).
  Do not claim the other stage names — Lievä ärsytys, Kytevä vitutus,
  Kova vitutus, Raivovitutus, Täysvitutus — are from the study; they're
  original, built in the same register.

- Stage I–IX, ascending severity:
  ```
  I    Lievä ärsytys
  II   Kytevä vitutus
  III  Perusvitutus
  IV   Keskivaikea vitutus
  V    Kova vitutus
  VI   Syvävitutus
  VII  Raivovitutus
  VIII Täysvitutus
  IX   Vitutus maximus
  ```

- emotional_damage_score and stage are separate derived concepts computed
  from the same (emotion, intensity) pair but shown independently: damage
  is a 0–1000 number (per-emotion base score + intensity multiplier), stage
  is the Roman-numeral diagnosis label.

- Derive when useful:
  - subgenre (deterministic emotion+intensity → genre lookup; never left to
    model judgment — the model is handed the subgenre, not asked to pick it)
  - fallback genre (used if the primary genre's artist pool runs thin)
  - artist recommendation (exactly 10 real, existing artists per session)
  - damage score (0–1000)

- Session state (current emotion/intensity/stage) and any longer-term user
  baseline are separate concepts — there is currently no persisted baseline;
  every session starts fresh.

- trigger_text mainly supports flavor copy (the "Incident Summary" /
  "Recommended Corrective Action" prose) and the receipt line item; do not
  rigidly map specific triggers to genres — subgenre is decided only by
  (emotion, intensity).

- Sonic Catharsis is playful and cathartic, not a clinical or diagnostic
  tool. The "Epicrisis," "Diagnosis," "Attending: Dr. Catharsis, M.D."
  framing is a deliberate joke — never present inferred emotional states,
  stage names, or genre logic as medical facts.

## Where each piece actually lives in code

- Emotions, glyphs, field positions: `src/components/EmotionWheel.tsx`
- Intensity scale, slider, hidden 11th tier: `src/lib/theme.ts` (`MAX_STRESS_INTENSITY`, `TOTAL_INTENSITY_LEVELS`, `STRESS_TIERS`), `src/components/IntensitySlider.tsx`
- Stage (Circle) names + deterministic emotion→stage mapping: `src/lib/theme.ts` (`CIRCLES`, `getActiveCircle`)
- Damage score formula: `src/lib/theme.ts` (`calculateDamageScore`)
- Deterministic subgenre + fallback lookup: `src/lib/genre-mapping.ts`
- Matcher/curator model instructions: `src/lib/prompts.ts`
- Vitutus study citation QR: `src/components/ReceiptCard.tsx`
