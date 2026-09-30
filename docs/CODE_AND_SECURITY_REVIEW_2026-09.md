# Code & Security Review — 2026-09-30

**Scope**: `main` @ `52898a3` — `src/**`, `next.config.js`, `package.json`, `.gitignore`
**Reviewer**: Claude Code (AI-assisted review)
**Supersedes**: `docs/SECURITY_REVIEW.md` (2025-10-02, Next 15 / hosted Prompt Objects era — several of its file paths and findings no longer apply)

## Summary

| Check | Result |
|---|---|
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| Secrets in tracked files / git history | none found (only `sk-proj-...` placeholder in docs) |
| `.env*` ignored, `.env.local` is a symlink outside repo | ✅ |
| Client XSS sinks (`dangerouslySetInnerHTML`, model-supplied `href`) | none — Bandcamp links are built client-side with `encodeURIComponent` |
| Automated tests | none exist |

Overall: no critical vulnerabilities. The main risk is **cost abuse of the two unauthenticated OpenAI-backed endpoints**, which can be used as a general LLM proxy.

## Remediation status (updated 2026-09-30)

| ID | Status | Commit / action |
|---|---|---|
| S1 | ⏳ **Manual action needed**: Vercel WAF rule + OpenAI budget (see below) | no code change (decision: edge rate limiting) |
| S2 | ✅ Fixed | `045a524`: `SubgenreSchema`, `CuratorArtistsSchema` |
| S3 | ✅ Fixed | `162d7f7`: `reasoning` built from validated fields; no `debug` |
| S4 | ✅ Fixed (report-only) | `d7d9e21`: switch to enforcing after a clean production run |
| S5 | ✅ Fixed | `162d7f7` |
| S6 | ✅ Mitigated by S1–S3 | no change |
| C1 | ✅ Fixed | `33089ce`: Vitest; 47 tests incl. route tests with mocked OpenAI |
| C2, C3, C8 | ✅ Fixed | `045a524` |
| C4, C5, C6 | ✅ Fixed | `43adeae`: `lib/openai-response.ts`; retry once, then 500 (decision: no fabricated fallbacks) |
| C7, C10 | ✅ Fixed | `0c31588`: `lib/openai-client.ts` |
| C9 | ✅ Fixed | `334fd8d`: `eslint-config-next@16`, native flat config |

Verified end-to-end on a local production build: matcher and curator both
return 200, the receipt QR renders, CSP headers are present, and there are
no CSP violations.

### S1 setup: Vercel WAF rate limit (manual)

Vercel dashboard → project → **Firewall** → **Configure** → **New Rule**:

| Field | Value |
|---|---|
| Name | `api-rate-limit` |
| If | **Request Path** · *starts with* · `/api/` |
| And | **Method** · *equals* · `POST` |
| Then | **Rate Limit**, fixed window, **60 s**, **10 requests**, key: **IP** |
| Action on limit | **Too Many Requests (429)** |

10/min/IP is a starting point. One full reading is 2 requests (matcher +
curator), so this allows about 5 readings a minute per person. Adjust it
after looking at real traffic in the Firewall tab.
Publish the rule, then confirm with a burst of 11 `curl -X POST` requests
to `/api/matcher` that the 11th gets a 429. The page already shows the
error message for non-2xx responses.

**OpenAI**: platform.openai.com → Settings → Limits. Set a monthly budget
and an email alert at about 50% of it. This is the backstop if the WAF rule
is ever removed or bypassed.

### Follow-ups noticed during remediation (not part of the original findings)

- `ReceiptCard.tsx` sets `height="auto"` on an `<svg>`, which is invalid and
  logs a console error when the receipt opens. This was already there.
- The README's sample `cause` text names the Stage ("textbook Raivovitutus,
  Stage VII"), which the matcher now strips out. The example is outdated.

## Findings

Severity: 🔴 High · 🟠 Medium · 🟡 Low · ⚪ Info

### 🔴 S1 — No rate limiting on `/api/matcher` and `/api/curator` (denial-of-wallet)

- **Where**: `src/app/api/matcher/route.ts`, `src/app/api/curator/route.ts`; no `middleware.ts`.
- **Issue**: Both routes are anonymous and each request triggers a paid `gpt-4.1` call. Nothing limits requests per IP, per session, or in total.
- **Scenario**: A script loops `POST /api/curator` and runs up the OpenAI bill until the account hits its cap. The app then stops working for everyone.
- **Fix**: Add per-IP rate limiting, e.g. Vercel WAF rate-limit rules or `@upstash/ratelimit` in `middleware.ts`. Also set a hard monthly budget and alerting in the OpenAI dashboard.

### 🟠 S2 — `analysis.subgenre` is an unbounded, client-controlled string passed straight into the Curator prompt

- **Where**: `src/lib/validation.ts:91` (`subgenre: z.string()`), `src/app/api/curator/route.ts:53`.
- **Issue**: The client echoes the Matcher's `analysis` back to the Curator. Because `subgenre` has no length limit or content check, a caller can send any text as the prompt, of any length. The success path returns `parsed.Selection` without validating its shape, so the model output goes back to the caller as-is. That turns the endpoint into a free GPT-4.1 proxy and increases the risk from S1: a long input also means a large token bill for a single request.
- **Fix**: Cap it (for example `z.string().trim().min(1).max(80)`) and restrict it to a character allowlist such as `^[\p{L}\p{N} &'/-]+$`. Validate the Curator output with a zod schema, `{ Selection: z.array(z.object({ artist: z.string().max(100) })).max(15) }`, and return only the validated fields. Longer term, have the server sign or look up the Matcher result (for example with an HMAC token) instead of trusting a client echo.

### 🟠 S3 — Raw model output is returned to the client

- **Where**: `matcher/route.ts:313` (`reasoning: responseText`), `curator/route.ts:192-197` (`debug.responsePreview`, `debug.playlistResult` in a 500 response); consumed at `src/app/page.tsx:206-207`.
- **Issue**: Together with S2 and the 500-character `event` field, callers can read back arbitrary model output. The `debug` payload is also leftover development scaffolding in a production error response.
- **Fix**: Remove `reasoning` (check first whether any client still reads it; `page.tsx` appears to use only `analysis`/`cause`/`choice`/`subgenre`). Remove the `debug` object from the 500 response and the `console.error` for it in `page.tsx`.

### 🟡 S4 — Missing Content-Security-Policy; deprecated `X-XSS-Protection`

- **Where**: `next.config.js` headers.
- **Issue**: No CSP header is set. `X-XSS-Protection: 1; mode=block` is deprecated, modern browsers ignore it, and it can introduce XS-Leak side channels in old browsers.
- **Fix**: Add a CSP, starting in `Content-Security-Policy-Report-Only`. Roughly: `default-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://va.vercel-scripts.com; frame-ancestors 'self'`, plus nonce-based `script-src` or `'unsafe-inline'` as Next requires. Replace `X-XSS-Protection` with `0` or drop it.

### 🟡 S5 — Model output logged server-side

- **Where**: `curator/route.ts:80`, `:188-189`.
- **Issue**: Up to 1,000 characters of model output go to the logs on every request. The Curator input no longer contains the user's incident text, so the privacy risk is low. It is still noise and goes against the 2025 "privacy-preserving logging" fix.
- **Fix**: Remove the `console.log` at line 80. Keep a structured error log without the payload.

### 🟡 S6 — Prompt injection via `event` inside the gap directive

- **Where**: `matcher/route.ts:114`.
- **Issue**: `trimmedEvent` is placed inside a quoted instruction string. It is under 15 characters, so the impact is only on the user's own output. Noted for completeness; no action needed beyond S1 and S3.

## Code quality

| # | Where | Issue | Suggestion |
|---|---|---|---|
| C1 | whole repo | No unit tests. The project playbook asks for tests on pure logic. `getActiveStage`, `isPseudoVitutusProfile`, `getDeterministicGenre`, `removeDisplayedCondition`, and the zod schemas are pure and easy to test | Add Vitest; start with `lib/theme.ts` stage derivation and `removeDisplayedCondition` |
| C2 | `matcher/route.ts:293-316` | `AnalysisSchema.safeParse` is run, but the unparsed `analysisResult` is returned. Extra model-invented keys pass through to the client | Return `parsed.data` (stripped) |
| C3 | `matcher/route.ts:61`, `curator/route.ts:18` | Malformed JSON body makes `request.json()` throw and returns a **500** | Catch it and return 400 |
| C4 | both routes | `output_text` extraction logic is duplicated, and the matcher has two near-identical fallback loops | Extract `getResponseText(response)` into `lib/` |
| C5 | `matcher/route.ts:207-261` | The free-text fallback uses keyword heuristics ("corporate", "IT", "transformation") from an older persona, with a hardcoded default cause "Professional burnout and organizational stress" | Remove it; the model is instructed to return JSON, so fail with 500 or retry once |
| C6 | `curator/route.ts:168-176` | The last-resort fallback returns fake artists ("death Artist 1") as a 200 response | Return an error instead; fake bands shown as real prescriptions are worse than a retry message |
| C7 | `curator/route.ts:29-36`, `validation.ts:100` | `emotionData` is required on the Curator request but unused. The `!analysis \|\| !emotionData` guard is dead code after zod validation | Keep it if it's a deliberate compatibility decision (as commented), but drop the dead guard |
| C8 | `page.tsx:215` | `artistItem.artist` from unvalidated model JSON is assumed to be a string. A number or object would render oddly or crash React | Fixed by the output schema in S2 |
| C9 | `package.json` | `eslint-config-next` is pinned to `15.5.3` while `next` is `^16.3.6` | Align to the 16.x config |
| C10 | both routes | `new OpenAI()` runs on every request, and a missing `OPENAI_API_KEY` only shows up at request time as a generic 500 | Use a lazily memoized client plus a startup/env zod check (playbook: "validate env at startup") |

## Recommended order

1. S1 rate limiting and an OpenAI budget cap
2. S2 bound `subgenre` and validate Curator output
3. S3 remove raw output and debug from responses
4. C1 add Vitest for the pure `lib/` logic
5. S4 CSP (report-only first)
6. Remaining cleanups (C2–C10, S5)
