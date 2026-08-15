# Study Buddy Hub

Study Buddy Hub is a React, TypeScript, and Vite PWA for Cambridge International AS & A Level study tracking. The repository is being migrated incrementally from a local-first application to an authenticated Supabase-backed product.

## Current status

### Currently implemented

- Supabase authentication, protected routes, session restoration, profiles, and database-backed onboarding.
- Catalogue-driven authenticated subject selection with custom subjects, archive/restore, stable legacy UI IDs, and a maximum of seven active subjects.
- Local syllabus bullets, confidence tracking, notes, past-paper attempts, analytics, reminders, reflections, themes, accessibility settings, and backup compatibility.
- TanStack Query for current cloud subject state.
- Vite PWA support and Vercel-compatible Git deployment.

### Planned / in migration

- Supabase persistence for syllabus progress, notes, components, past papers, and other private study data.
- IndexedDB caching, a durable offline operation queue, conflict handling, and guided migration of legacy browser data.
- A protected server-side AI pipeline with authentication, quotas, validation, and provider secrets kept outside the browser.
- Encrypted export/import and wider private-beta hardening.

### Deferred

- Real AI provider access from the application until the protected server-side pipeline exists.
- Multi-board and multi-qualification catalogue support beyond the initial Cambridge International AS & A Level target.
- Full notification orchestration, Google Calendar integration, and offline conflict-resolution UX.

The cloud subject selection is authoritative for authenticated users. Bullets, past papers, settings, and other not-yet-migrated study data continue to use local compatibility storage during this staged migration; the repository does not claim that all study data is cloud-synchronised.

## Local development

Requirements: Node.js 22 LTS and npm.

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` and use the local or approved development Supabase values:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Never place service-role credentials, database passwords, or real AI provider secrets in `VITE_*` variables. Those variables are included in the browser bundle.

An optional deterministic AI mock is available only during local development:

```env
VITE_AI_PROVIDER=mock
```

The mock uses no provider credential and does not enable production AI.

## Standard checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

For local database validation when the Supabase stack is running:

```sh
npx supabase db lint --level warning
npx supabase test db
```

Do not reset or push a linked Supabase database merely to run these checks.

## Deployment

The frontend is intended for Vercel Git deployment using the npm lockfile. Production configuration requires the public Supabase URL and publishable key only. Protected server secrets belong in the relevant trusted backend environment when those later phases are implemented.

## Documentation

- [Stage 2 requirements](docs/STUDY_BUDDY_HUB_STAGE_2_REQUIREMENTS_SCOPE.md)
- [Approved Stage 3 architecture](docs/STUDY_BUDDY_HUB_STAGE_3_ARCHITECTURE_PLAN_DRAFT_3_APPROVED.md)
- [Subject-selection handoff](docs/architecture/STUDY_BUDDY_HUB_SUBJECT_SELECTION_IMPLEMENTATION_HANDOFF.md)
- [Security notes](docs/security/SECURITY_NOTES.md)
- [Manual QA checklist](docs/qa/MANUAL_QA_CHECKLIST.md)
