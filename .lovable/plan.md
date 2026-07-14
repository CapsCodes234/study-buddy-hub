# Stage 1 Security Audit — Study Buddy Hub

Read-only review. No code was modified. App is a client-only React/Vite PWA with `localStorage` persistence and optional direct-from-browser calls to an OpenAI-compatible AI provider. There is **no backend, no auth, no database** in the repo.

---

## 1. Client-side API keys & env vars

**Finding:** AI provider API key is read from `import.meta.env.VITE_AI_API_KEY` and used directly from the browser.
**Evidence:** `src/ai/aiClient.ts:276, 313`; `src/ai/summarizer.ts:61,126`; `SECURITY_NOTES.md`.
**Severity:** Low (personal) / **Critical** (multi-user).
**Status:** Confirmed.
**Current impact:** User's own key in their own browser — acceptable local-first use. Any `VITE_*` var is bundled into the shipped JS and visible to anyone loading the site.
**Future impact:** If ever deployed with a shared key baked in, that key is fully exfiltratable → unlimited billed usage by third parties.
**Action:** Before public deploy, move all AI calls behind a server proxy (Edge Function / Lovable AI Gateway) and delete every `VITE_AI_*` reference. Never put provider secrets in `VITE_` vars.

---

## 2. AI provider requests

**Finding a — No request signing / origin restriction.** Requests go straight from browser to OpenRouter/OpenAI with the user's key in `Authorization`.
**Severity:** Medium / High (multi-user).
**Status:** Confirmed.
**Impact:** Key travels via user's browser to third party; no server-side auditability.
**Action:** Proxy through backend; restrict CORS and add per-user rate limits.

**Finding b — Untrusted AI output is parsed and rendered.** Mitigated by `sanitizeAIText`, `containsForbiddenContent`, and Zod validation in `src/ai/guards.ts`, `src/lib/validation.ts` (`validateExtractedSyllabus`).
**Severity:** Low.
**Status:** Confirmed mitigated. Keep validators in place if response shape changes.

**Finding c — Prompt injection via user-supplied PDF/CSV/notes.** No guardrails distinguish system prompt from user content.
**Severity:** Medium (multi-user).
**Status:** Possible.
**Impact:** A malicious PDF/CSV could try to alter AI behaviour or exfiltrate other prompt context. Currently low because output is validated to a strict schema before use.
**Action:** Keep strict output schemas; on multi-user, isolate prompts per user and never concatenate user text into privileged system prompts.

---

## 3. PDF and CSV uploads

**Finding a — PDF parsed client-side via `pdfjs-dist` worker loaded from `unpkg.com` CDN with no SRI.**
**Evidence:** `src/lib/pdfExtractor.ts` (`workerSrc = https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`).
**Severity:** Medium / High (multi-user).
**Status:** Confirmed.
**Impact:** Supply-chain / CDN compromise would execute attacker JS in every user's browser. No integrity hash, no fallback.
**Action:** Self-host the worker from `/public` (or bundle it) or pin to a versioned URL with `integrity=` SRI hash. Add a strict CSP.

**Finding b — No explicit PDF size/page cap in `extractTextFromPDF`.** Memory (`file.arrayBuffer()`) is bounded only by the browser.
**Severity:** Low.
**Status:** Confirmed.
**Action:** Enforce documented limits (project memory says max 3 PDFs, <10MB) at the upload boundary.

**Finding c — CSV import is size-limited and Zod-validated.** `csvBulletSchema`, `sanitizeCSVCell` strips formula-injection prefixes (`=+-@\t\r`).
**Severity:** Low (mitigated).
**Status:** Confirmed mitigated. Good.

---

## 4. Input validation & sanitisation

**Finding:** Broad Zod coverage in `src/lib/validation.ts` (bullets, papers, subjects, settings, full app state, extracted syllabus). `safeJSONParse` strips `__proto__`/`constructor`/`prototype`.
**Severity:** Low.
**Status:** Confirmed mitigated.
**Gap:** Some persisted structures written before validation existed (e.g. `study-tracker-chapter-planning`, `study-tracker-components`, streak/milestone stores) rely on ad-hoc guards, not schema parse on load in every path.
**Action:** Standardise "schema parse on load" for every localStorage key before multi-user work.

---

## 5. localStorage & browser data

**Finding a — All study data is unencrypted in `localStorage`.**
**Evidence:** `study-tracker-data`, `study-tracker-components`, `study-tracker-subject-components`, `study-tracker-extraction-changelog`, `study-tracker-chapter-planning`, reminders, streak, milestones, sync queue, theme overrides.
**Severity:** Low (personal) / High (shared device).
**Status:** Confirmed.
**Impact:** Any script on the origin (including a future compromised dependency) can read/exfiltrate all study data. Shared/lost device exposes everything.
**Action:** Accept for personal use; for multi-user move authoritative data server-side with RLS and treat local copy as cache.

**Finding b — No storage quota / corruption handling beyond try/catch.** A `QuotaExceededError` would silently drop writes in several places.
**Severity:** Low.
**Action:** Surface quota errors to the user.

---

## 6. JSON import / export & backup restore

**Finding a — Backup file is plaintext JSON containing full study history.**
**Evidence:** `src/lib/storage.ts` `exportAsJSON`/`importFromJSON`; `SECURITY_NOTES.md` v3 schema.
**Severity:** Low (personal) / Medium (multi-user).
**Status:** Confirmed.
**Impact:** If shared or synced via cloud, contents are readable. Web Share API path may hand the file to arbitrary third-party apps.
**Action:** Warn users on export; offer optional passphrase-based encryption.

**Finding b — Import trust boundary.** Import runs Zod validation and dedupe, but any valid-shaped JSON will be written into all listed localStorage keys, overwriting the current session.
**Severity:** Medium.
**Status:** Confirmed.
**Impact:** A malicious backup file could plant crafted long strings, misleading "notes", or attempt oversized payloads. Text is length-capped by schemas — good — but no allow-list on unknown top-level keys everywhere.
**Action:** On import, refuse unknown fields (`.strict()`), show a diff/confirmation, and require an explicit "Replace all data" confirmation.

---

## 7. Authentication readiness

**Finding:** No authentication exists. No login, no session, no user identity.
**Severity:** N/A (personal) / **Critical blocker** (multi-user).
**Status:** Confirmed.
**Action:** Before any shared deployment, add auth (Lovable Cloud / Supabase). Do not "bolt on" auth after data is public.

---

## 8. Authorization readiness

**Finding:** No authorization layer, no role model, no policy enforcement. All data is trivially readable/writable via devtools.
**Severity:** N/A / **Critical** (multi-user).
**Status:** Confirmed.
**Action:** Design roles + RLS policies before migrating storage. Follow the project's own `user-roles` guidance (separate `user_roles` table + `has_role` security-definer function).

---

## 9. Multi-user data isolation

**Finding:** Data model has no `user_id`/tenant field. Everything is keyed by client-side ids only.
**Severity:** N/A / **Critical** (multi-user).
**Status:** Confirmed.
**Action:** When migrating: add `user_id uuid references auth.users(id)` to every table, enable RLS with `auth.uid() = user_id`, and grant only `authenticated`.

---

## 10. XSS / unsafe rendering

**Finding a — Only `dangerouslySetInnerHTML` usage is in `src/components/ui/chart.tsx:70` for generated CSS variables (shadcn boilerplate).** Input is derived from developer-controlled config, not user text.
**Severity:** Low.
**Status:** Confirmed low-risk. Verify no user-supplied strings ever reach that config.

**Finding b — Rendering of user text (notes, comments, AI output) goes through React text nodes** → auto-escaped. No `innerHTML=`, no `eval`, no `new Function` in `src/`.
**Severity:** Low.
**Status:** Confirmed.

**Finding c — No Content-Security-Policy meta tag / header.** `index.html` and hosting config not seen to set one; combined with unpkg CDN worker (Finding 3a), XSS blast radius is larger than needed.
**Severity:** Medium.
**Action:** Add a strict CSP (default-src 'self'; connect-src for AI provider only; script-src 'self' + pinned CDN hash if kept).

---

## 11. Dependencies & packages

**Finding:** 55 runtime + 18 dev deps (per `package.json`). Includes `pdfjs-dist`, AI SDK, Radix, Zod, etc. `SECURITY_NOTES.md` recommends periodic `npm audit` but no CI evidence in-repo.
**Severity:** Medium.
**Status:** Cannot be verified without running `npm audit` / `code--dependency_scan`.
**Action:** Run `code--dependency_scan` in a follow-up stage; add Dependabot/renovate + `npm audit --audit-level=high` in CI. Pin `pdfjs-dist` and lock its worker version.

---

## 12. Rate limiting & AI cost abuse

**Finding:** No client-side throttling, no per-user quotas, no request counting. `SECURITY_NOTES.md` notes it as a "Low priority" enhancement.
**Severity:** Low (personal, user's own key) / **Critical** (multi-user or shared key).
**Status:** Confirmed.
**Impact:** A stuck retry loop or malicious page interaction could burn through credits.
**Action:** Add client debounce + a hard daily call cap; enforce real rate limits at the server proxy when introduced.

---

## 13. Error messages / info disclosure

**Finding a — Error strings include env-var names (`VITE_AI_API_KEY`) and internal paths** in toasts/console (`src/ai/summarizer.ts`, `src/lib/pdfExtractor.ts`).
**Severity:** Low.
**Status:** Confirmed.
**Impact:** Personal app — fine. Public app — leaks internal config names to end users.
**Action:** For multi-user, use generic user-facing messages and log details only to server.

**Finding b — `console.error` used in several storage paths (`src/lib/storage.ts` lines 90, 100, 108).** Could log user data on errors.
**Severity:** Low.
**Action:** Gate verbose logs on `import.meta.env.DEV`.

---

## 14. Deployment / Vercel / hosting config

**Finding:** Repo contains no `vercel.json`, no CSP/security headers config, no `robots`/`Referrer-Policy` settings beyond default `public/robots.txt`, no `.env.example` documenting which vars are safe.
**Severity:** Medium.
**Status:** Cannot be verified (no deployment config in repo).
**Impact:** Default hosting = no CSP, no HSTS opinions, permissive referrer.
**Action:** Add `vercel.json` (or equivalent) with `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. Document required env vars and mark all `VITE_*` explicitly as public.

---

## 15. Privacy — uploaded documents & study data

**Finding a — PDFs are parsed in-browser only** (no upload to server). Good default.
**Severity:** Low.
**Status:** Confirmed.

**Finding b — When AI is enabled, extracted PDF/CSV text is sent to the third-party AI provider** with the user's key. No user consent screen shown before first outbound request beyond the general onboarding modal.
**Severity:** Medium.
**Status:** Confirmed.
**Action:** Explicit "your syllabus text will be sent to <provider>" consent + link to provider's data-retention policy before first AI call.

**Finding c — Backups may include unredacted personal notes and reflections.**
**Severity:** Low / Medium.
**Action:** Note this in export UI; consider optional encryption (see Finding 6a).

---

## Prioritised summary

| Priority | Finding | Applies now? |
|---|---|---|
| P0 (blocker for multi-user) | 1, 7, 8, 9, 12 | Only when going public |
| P1 (fix before public deploy) | 3a (unpkg worker + SRI/CSP), 6b (strict import), 10c (CSP), 14 (headers) | Recommended soon |
| P2 (nice to have now) | 4 (schema-on-load everywhere), 5b (quota UX), 11 (dep scan in CI), 13 (dev-only logs), 15b (consent) | Personal use OK as-is |
| Already mitigated | 3c (CSV injection), 4 (Zod + prototype-pollution guard), 10a/b (React escaping) | Keep as regressions come |

---

## Suggested next stages (not executed)

- **Stage 2:** Run `code--dependency_scan` and address any High/Critical dep findings.
- **Stage 3:** Add CSP + security headers + self-hosted pdf worker (small, low-risk change).
- **Stage 4:** When ready for multi-user, do the auth/RLS/proxy migration as a single coordinated slice — do not partial-migrate.

No files were changed. Approve to move any specific item into an implementation plan.
