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

- stage (I–IX) is the single derived severity classification for a session.
  It is computed deterministically from emotion + intensity and is used for
  receipt/diagnosis framing and presentation.

- Intensity remains the user's direct 1–10 / hidden 11 input. Stage is the
  app's interpretation of that intensity in the context of the selected
  emotion:
  ```
  Emotion   = what kind of feeling
  Intensity = how strong it feels
  Stage     = what Sonic Catharsis calls that combination
  Subgenre  = what it sounds like
  ```

- There is no separate numeric "Emotional Damage" score anymore — it was
  another transformation of the same (emotion, intensity) pair, competing
  with stage for attention without adding information. The *phrase*
  "Emotional Damage" may still appear as flavor copy (e.g. "EMOTIONAL
  DAMAGE ASSESSMENT COMPLETE"), but it is not a data variable.

- Derive when useful:
  - subgenre (deterministic emotion+intensity → genre lookup; never left to
    model judgment — the model is handed the subgenre, not asked to pick it)
  - fallback genre (used if the primary genre's artist pool runs thin)
  - artist recommendation (exactly 10 real, existing artists per session)

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
- Stage names + deterministic emotion→stage mapping: `src/lib/theme.ts` (`STAGES`, `getActiveStage`)
- Stage header display: `src/components/StageHeader.tsx`
- Deterministic subgenre + fallback lookup: `src/lib/genre-mapping.ts`
- Matcher/curator model instructions: `src/lib/prompts.ts`
- Vitutus study citation QR: `src/components/ReceiptCard.tsx`
