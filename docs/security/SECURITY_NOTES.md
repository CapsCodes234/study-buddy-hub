# Security Notes — Study Buddy Hub

## Current security boundary

Study Buddy Hub now has Supabase authentication, protected routes, database-backed profiles/onboarding, and user-owned subject selection. Supabase remains the authoritative source for authenticated subject selections.

Other study domains are still in staged migration. Local syllabus bullets, notes, past-paper attempts, settings, and related compatibility data remain in browser storage and must not be described as fully cloud-synchronised or encrypted.

## Environment variables

Browser-visible configuration is limited to public Supabase client values:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

All `VITE_*` variables are bundled into client code. Never place any of the following in them:

- Supabase service-role or secret keys;
- database passwords;
- OpenAI, OpenRouter, Gemini, Groq, or other paid-provider secrets;
- OAuth client secrets;
- private signing or encryption keys.

`.env.local` is ignored and has not been tracked in repository history. A publishable/anonymous Supabase client key is not a service-role secret, but database Row Level Security must still enforce all private-data access.

## AI status

Real AI is disabled in the production browser. The old direct provider transport and browser key lookup have been removed. A deterministic mock can be enabled only for local development with `VITE_AI_PROVIDER=mock`; it uses no provider credential.

Production AI remains deferred until an authenticated server-side implementation provides:

- server-held provider credentials;
- per-user authorization, quotas, and rate limits;
- structured-output validation;
- usage and failure records;
- document-processing disclosure and consent;
- safe retention and cleanup behavior.

Do not restore direct browser calls as an interim shortcut.

## Local persistence and backups

- Browser storage is plaintext and accessible to scripts running on the same origin.
- The authenticated subject list is cloud-authoritative; the persisted local subject array is a frozen compatibility/recovery snapshot only.
- Backup files can contain private study history and are not yet encrypted.
- Imports are validated and deduplicated, but the planned encrypted merge/preview workflow is not yet complete.
- Signing out must remove old-user subject query caches; device-only preferences may remain.

## Supabase rules

- Never expose or commit service-role credentials.
- Never weaken RLS to make a frontend query pass.
- Normal `user_subjects` mutations use approved RPCs.
- Subject removal archives; permanent soft deletion is not a normal UI operation.
- Official catalogue data is shared read-only data, while custom subjects and selections are user-owned.
- Preserve `.env.example` with placeholders only.

## Dependency and CI policy

The canonical package manager is npm and `package-lock.json` is the only lockfile. CI runs install, lint, typecheck, tests, and production build. Dependency advisories must be reviewed separately for production and development reachability; major upgrades require their own compatibility checkpoint.

## Remaining security work

- Complete cloud migration and owner-isolation tests for all private study domains.
- Replace compatibility browser storage with the approved IndexedDB cache/operation model.
- Implement encrypted manual exports.
- Add the protected AI backend and consent flow.
- Complete CSP/security-header and self-hosted PDF worker work.
- Add production monitoring, cost controls, privacy review, data export, and account deletion before public beta.
