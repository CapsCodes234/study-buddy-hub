# Study Buddy Hub Revival Plan

**Document status:** Stage 1 consolidated draft  
**Project phase:** SDLC revival — existing application improvement, not a rebuild  
**Initial release target:** Web application deployed on Vercel  
**Later phases:** Desktop packaging and Google Play / Apple App Store distribution  
**Primary Stage 1 evidence:** Study Buddy Hub — Stage 1 Raw Audit Notes

---

## 1. Purpose of This Document

This document consolidates the Stage 1 audit of Study Buddy Hub into a single control plan for the next stages of the software development life cycle.

Study Buddy Hub should not be rebuilt from scratch. It is already a functioning local-first study management web application. The purpose of the revival cycle is to:

1. understand the existing system accurately;
2. preserve working features;
3. resolve technical debt and usability problems;
4. migrate from local browser storage to a secure multi-user cloud architecture;
5. improve AI syllabus extraction;
6. prepare the web app for private beta, public beta, and stable public use.

This document records the current state, confirmed strengths, risks, public-release blockers, open questions, and priorities that Stage 2 must convert into final product requirements.

---

## 2. Project Status

### 2.1 Current maturity

| Stage | Status |
|---|---|
| Initial prototype | Completed |
| Serious personal-use application | Completed / usable |
| Advanced local-first beta | Current state |
| Private multi-user beta | Not ready |
| Public web beta | Not ready |
| Stable public web release | Not ready |
| Desktop and app-store versions | Future phase |

### 2.2 Current product summary

Study Buddy Hub is a React and TypeScript web application for academic planning and exam preparation. Its existing capabilities include:

- subject dashboards;
- syllabus tracking;
- confidence-state tracking;
- CSV syllabus import;
- AI-assisted PDF syllabus extraction code;
- chapter deadlines;
- past-paper logging;
- past-paper analytics;
- component-level analysis;
- exams and reminders;
- study streaks and milestones;
- backups and data import/export;
- subject-specific themes;
- accessibility options;
- PWA installation and offline local use.

The current app is suitable for one person using one browser profile. It is not yet suitable for public multi-user use because it has no authentication, server database, authorization, user-level data isolation, secure AI proxy, production monitoring, or complete automated end-to-end testing.

### 2.3 Confirmed release scope

The current SDLC revival cycle covers:

- browser-based web application;
- deployment through Vercel;
- responsive use on phones, tablets, and computers;
- optional PWA installation;
- private web beta;
- public web beta;
- stable web release.

The following are outside the current cycle:

- Windows or macOS desktop installers;
- Microsoft Store distribution;
- native Android or iOS development;
- Google Play Store distribution;
- Apple App Store distribution.

---

## 3. Current Technology and Architecture

### 3.1 Technology stack

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui and Radix UI
- TanStack Query, currently installed but not actively used for server state
- Recharts
- Zod
- pdfjs-dist
- Vitest
- React Testing Library
- vite-plugin-pwa
- localStorage-based persistence

### 3.2 Application structure

The application uses `src/main.tsx` as its entry point and `src/App.tsx` for its provider tree and route declarations.

Most routes resolve to a central `src/pages/Index.tsx` shell. The shell determines which view to render based on the current URL. Subject pages are lazy-loaded, but most application state is created in `Index.tsx` through `useAppState` and passed down through props.

### 3.3 State-management model

The app does not use Redux, Zustand, Jotai, or another dedicated global store.

The main state is handled by `useAppState`, which stores:

- subjects;
- syllabus bullets;
- past-paper attempts;
- general settings.

Component metadata is handled separately by `useComponents`, which reads and writes its own localStorage key.

Additional features such as deadlines, reminders, exams, themes, reflections, streaks, milestones, and extraction history use their own independent persistence paths.

### 3.4 Main architectural concern

The app does not have one unified persistence layer. It has a central state silo plus several detached feature-specific stores.

This creates:

- duplicated or overlapping concepts;
- possible orphaned records;
- difficult cloud migration;
- inconsistent validation;
- direct dependence on browser APIs;
- complex backup and restore logic;
- risk that one feature updates without other features reacting.

---

## 4. Current Data-Persistence Map

The Stage 1 audit found approximately 16 localStorage keys or persistent browser-storage areas.

| Data area | Current persistence | Public-version direction |
|---|---|---|
| Subjects | `study-tracker-data` | Cloud database, scoped to authenticated user |
| Syllabus bullets and confidence states | `study-tracker-data` | Cloud database |
| Past-paper attempts | `study-tracker-data` | Cloud database |
| General settings | `study-tracker-data` | Split between cloud user settings and local device preferences |
| Custom component metadata | `study-tracker-components` | Unified cloud component model |
| Syllabus/default component metadata | `study-tracker-subject-components` | Reconcile with custom component model |
| AI extraction history | `study-tracker-extraction-changelog` | Optional cloud audit/history or discardable temporary data |
| Chapter deadlines | `study-tracker-chapter-planning` | Cloud database if retained |
| Study streak | `study-tracker-streak` | Cloud database or derived activity record |
| Milestones | `study-tracker-milestones` | Cloud database or derived activity record |
| Offline sync queue | `study-tracker-sync-queue` | Replace with a functioning synchronization strategy |
| Scheduled reminders | `study-tracker-reminders` | Cloud-backed settings plus web notification logic |
| Smart progress weightings | `study-tracker-weighting` | Cloud user preference/configuration |
| Exam schedule | `study-tracker-exam-schedule` | Cloud database if retained |
| Weekly reflections | `study-tracker-reflections` | Cloud database |
| Completion celebration state | `chapter-completion-celebrated` | Local/transient UI state |
| Subject theme settings | localStorage theme keys | Local or optionally synchronized |
| Global appearance/accessibility | localStorage theme keys | Primarily local device preferences |

### 4.1 Confirmed persistence risks

- There is no user ID in the current data model.
- Component metadata is split across two overlapping representations.
- Chapter deadlines link to normalized chapter strings rather than database relations.
- Past-paper attempts store component IDs without enforced referential integrity.
- `useAppState` saves synchronously on state changes, which cannot be replaced directly with cloud writes without debouncing, optimistic updates, retries, and error handling.
- The existing sync queue is a stub and is not a complete offline synchronization system.
- Clearing and restoring data depends on several independent stores.
- Some auxiliary stores are not validated as consistently as the main app state.

---

## 5. Feature Inventory

### 5.1 Working and valuable features

#### Dashboard

**Status:** Working, but needs redesign and behavioural fixes.

Strengths:

- combines study progress, deadlines, past-paper performance, readiness, and next actions;
- gives a useful overall view once data exists.

Problems:

- contains too many similarly weighted cards;
- appears overwhelming when populated and broken when empty;
- some buttons navigate to the wrong place or do nothing;
- deadline and next-action links do not consistently focus the exact target;
- some lists continuously increase page length;
- Study Momentum occupies too much space;
- AI Daily Focus contains duplicate or weakly placed actions.

#### Subject overview

**Status:** Working.

Strengths:

- shows subject progress and related study information;
- supports subject-specific views.

Problems:

- too many large sections compete for attention;
- import should be prominent during setup, then become a smaller maintenance action;
- redundant navigation/page chrome consumes space;
- some sections are candidates for removal or reduction.

#### Syllabus tracking

**Status:** Working well.

Strengths:

- supports topics, subtopics, learning outcomes, notes, confidence states, filters, and progress;
- current confidence workflow is more developed than the old Red/Amber/Green wording.

Problems:

- onboarding still explains the old confidence model;
- several expanded chapters make the page excessively long;
- import is not available where empty-state messaging tells users to import;
- the feature contains substantial controls before the user reaches actual syllabus content.

#### CSV syllabus import

**Status:** Working and currently the most reliable import route.

Confirmed strengths:

- flexible header recognition;
- subject binding;
- validation;
- sanitisation;
- deduplication;
- single-subject import constraint;
- support for syllabus and component metadata when appropriate headings are supplied.

Known concern:

- the audit found more than one CSV path, with protections not necessarily consistent across all paths;
- the canonical CSV importer must be identified and standardised before public release.

#### AI syllabus extraction

**Status:** Implemented in code but not fully verified as a current production-quality feature.

Confirmed:

- PDF parsing code exists;
- an active import dialog contains an AI-extraction path;
- AI provider support includes OpenRouter, OpenAI-compatible calls, and mock mode;
- output is parsed and validated;
- a review step exists before saving;
- an unused richer upload component also remains in the repository.

Major limitations:

- previous OpenRouter key became invalid, preventing full live testing;
- provider key is exposed in the Vite client bundle;
- PDF text is truncated to approximately 12,000 characters;
- current parsing loses layout, table, and multi-column structure;
- scanned PDFs are not reliably supported;
- confidence information is discarded when converted into core syllabus bullets;
- component metadata is not integrated cleanly;
- the current approach cannot satisfy the future “upload almost any syllabus PDF without manual preparation” requirement.

#### Past-paper logging

**Status:** Working and valuable.

Strengths:

- supports paper attempt records;
- connects to analytics;
- supports started and completed states;
- calculates useful performance information.

Problems:

- the component prerequisite can create a dead end;
- users are not clearly taught what a component is;
- dialog headers and footers do not fully cover scrolling content;
- some controls and number fields need visual refinement;
- action placement and page header size should be reconsidered.

#### Past-paper analytics

**Status:** Working.

Strengths:

- year, session, and variant analysis;
- useful dashboard performance summaries.

Needs:

- maintain existing correctness during cloud migration;
- add automated tests for analytics and complete user workflows.

#### Component analyzer

**Status:** Working and useful.

Strengths:

- average, best, latest, trend, attempt count, and time-efficiency metrics;
- handles unknown component records.

Needs:

- stronger visual presentation;
- improved empty states;
- explanation for component concepts;
- more automated test coverage.

#### Chapter deadlines

**Status:** Functionally present but product direction is unresolved.

Current issues:

- navigation does not always focus the selected chapter correctly;
- setting deadlines is not sufficiently discoverable;
- date picker flexibility is limited;
- deadline lists can grow and extend the dashboard;
- user is considering removing or postponing this feature until after beta.

**Stage 2 decision required:** Retain for beta, simplify, postpone, or replace with a different planning approach.

#### Exams and reminders

**Status:** Present but direction unclear.

Current issues:

- exam workflow needs stronger visual separation and history;
- dialog scrolling has layout defects;
- reminders are not yet part of a complete internal/external notification architecture;
- user is considering postponing exams until Google Calendar and notification integration are properly designed.

**Stage 2 decision required:** Keep a simplified version, postpone, or redesign around external calendar integration.

#### Backup, export, and import

**Status:** Working and valuable.

Strengths:

- versioned JSON backup;
- backwards compatibility;
- merges and deduplicates data;
- includes important secondary stores;
- useful for local-first cross-device transfer.

Future question:

- backups remain useful after cloud migration for data portability, recovery, and user trust, but their role and UI should change.

#### Settings

**Status:** Working, but overloaded.

Problems:

- too many unrelated settings on one long page;
- AI provider configuration should not be exposed to ordinary public users;
- some developer or diagnostic controls should be removed from normal user view;
- an index, sections, or search may be needed.

#### Themes and accessibility

**Status:** Working.

Strengths:

- dark mode is visually effective;
- reduced-motion, high-contrast, and subject-theme functionality exist.

Problem:

- some light-mode theme distinctions are weak.

#### PWA and offline use

**Status:** Working for local browser data.

Important distinction:

- the PWA can load and operate locally;
- this is not yet a trustworthy cloud synchronization or offline conflict-resolution system.

---

## 6. UI/UX Findings

### 6.1 Critical first-time-user problems

1. Onboarding teaches an outdated confidence system.
2. The user is not guided toward one clear first action.
3. The empty dashboard displays too many zero-data analytics cards.
4. Import actions are split across inconsistent locations.
5. The empty syllabus page asks for import but provides no direct import action.
6. Past-paper logging becomes a dead end when component metadata is absent.
7. Navigation becomes crowded and does not clearly separate global pages from subjects.
8. Settings is represented mainly by an icon and may be difficult for new users to find.
9. Chapter deadline controls are difficult to discover.
10. Users are not clearly informed that current data is stored locally and can be lost.

### 6.2 Visual hierarchy problems

- Dashboard cards compete with each other.
- Readiness and Next Action are not given enough priority.
- Subject overview sections have similar visual weight.
- Breadcrumbs and titles repeat information.
- Import controls occupy too much space after setup.
- Some page headers consume excessive vertical space.
- Status colours and branding compete.
- Emoji and Lucide icon styles are mixed.

### 6.3 Mobile findings

The app was tested at 375px, 430px, 768px, and 1024px.

General result:

- core pages remain usable;
- tablet behaviour is stronger than small-phone behaviour.

Confirmed small-screen issues:

- top navigation is cramped;
- a vertical or menu-based mobile navigation pattern is needed;
- past-paper component options can extend beyond the dialog and viewport;
- long component names may wrap badly;
- notification placement should be reconsidered;
- streak presentation can dominate the screen;
- some alignment issues exist in Today’s Focus;
- past-paper dialogs need improvement.

### 6.4 UX direction for later stages

The web app should use progressive disclosure:

- setup and import actions first;
- next actions and readiness second;
- advanced analytics only after enough data exists.

The public version should teach users:

- how subjects are added;
- what syllabus import does;
- what confidence states mean;
- what a paper component is;
- where data is stored;
- what AI sends to third parties;
- what happens when a feature has no data.

---

## 7. Testing and Quality Assurance

### 7.1 Current tools

- Vitest
- JSDOM
- React Testing Library
- Jest DOM matchers
- ESLint
- TypeScript compiler
- manual QA checklist

### 7.2 Current automated-test result

The audit recorded:

- 8 test files;
- 94 tests;
- 88 passing;
- 6 failing.

All six failures are in parser helper tests.

### 7.3 Causes of current failing tests

- outdated expected return shape for topic-number parsing;
- missing em-dash support in paper-mark extraction;
- missing support for parenthesized letter subtopics;
- disagreement between test expectations and implementation for action-verb bullet detection.

These failures include both:

- genuine parser limitations;
- stale tests that no longer match the current implementation.

### 7.4 Existing strengths

Good logic-level coverage exists for:

- conversion and score calculations;
- progress weighting;
- streaks and milestones;
- reminders and notification scheduling;
- backup and storage integration;
- chapter planning utilities.

### 7.5 Major testing gaps

No meaningful automated coverage currently exists for:

- authentication;
- routing and navigation;
- onboarding;
- complete CSV import through the UI;
- complete PDF/AI extraction;
- past-paper create/edit/delete workflow;
- component assignment and analyzer UI;
- exams UI;
- settings;
- dashboard cards;
- themes;
- mobile interactions;
- PWA behaviour;
- offline synchronization;
- full backup round trip through the UI.

### 7.6 Engineering-quality gaps

- no E2E framework;
- no GitHub Actions or other CI pipeline;
- no automatic checks on pull requests;
- TypeScript strict mode is disabled;
- no `typecheck` package script;
- 19 lint warnings;
- build succeeds but reports CSS syntax warnings;
- both npm and Bun lockfiles exist, creating possible package-manager drift.

---

## 8. Security and Privacy Assessment

### 8.1 Confirmed strengths

- Zod validation is used for important data.
- Main-state JSON parsing includes prototype-pollution protection.
- React text rendering provides normal escaping.
- No confirmed application XSS path was found.
- CSV formula-injection protection exists in at least one import path.
- Current dependency audit reported no known npm vulnerabilities at the time of the Stage 1 check.
- PDFs are initially parsed in the browser rather than uploaded to an application server.

### 8.2 Public-release blockers

#### Client-side AI secrets

The AI key is read from a `VITE_*` environment variable and included in the client bundle.

**Impact:** Any public user could extract and misuse a shared key.

**Required direction:** Route AI requests through a Vercel serverless function, Supabase Edge Function, or another secure backend proxy.

#### No authentication

The app has no login, session, or user identity.

**Required direction:** Introduce authenticated user accounts before multi-user beta.

#### No authorization or row-level security

There is no server-side ownership model.

**Required direction:** Every cloud record must be tied to the authenticated user, with database-enforced access policies.

#### No usage controls

AI requests currently have no server-side rate limits, quotas, or cost controls.

**Required direction:** Add per-user limits, request logging, retries, and abuse protection.

#### Third-party AI privacy

When AI is enabled, extracted document text and some study information may be sent to the selected AI provider.

**Required direction:** Add clear consent, provider disclosure, privacy documentation, and a production provider/data-retention decision.

### 8.3 Other confirmed risks

- plaintext browser storage;
- plaintext backup files;
- inconsistent upload-size protections;
- possible browser freezes from large PDFs;
- PDF worker loaded from an external CDN without integrity protection;
- no confirmed Content Security Policy;
- no repository-based Vercel security-header configuration;
- some auxiliary stores have weaker validation;
- verbose errors may expose implementation details;
- storage quota failures may not be shown clearly;
- importing valid-shaped but maliciously crafted backup data needs stricter controls;
- no production monitoring or centralized error logging.

### 8.4 Current interpretation

These issues do not mean the existing personal app is unsafe to continue auditing and developing locally.

They mean:

- do not launch it publicly yet;
- do not place a shared paid AI key in the frontend;
- do not collect real multi-user data until identity and isolation exist;
- do not treat the current localStorage system as the final public architecture.

---

## 9. Confirmed Public-Release Blockers

| Blocker | Severity | Required before |
|---|---|---|
| No authentication | Critical | Private multi-user beta |
| No authorization/RLS | Critical | Private multi-user beta |
| No cloud database | Critical | Cross-device multi-user use |
| No user ownership fields | Critical | Any shared database |
| Client-exposed AI key | Critical | Public AI feature |
| No AI rate limits or cost controls | High | Public AI feature |
| Fragmented persistence model | High | Reliable cloud migration |
| Incomplete AI PDF pipeline | High | Public PDF extraction |
| No E2E tests | High | Public beta |
| No CI checks | High | Sustained team/agent development |
| Failing tests | High | Feature implementation work |
| Poor onboarding/import flow | High | Private beta |
| Mobile navigation/dialog defects | High | Public web beta |
| No monitoring | Medium/High | Public beta |
| No privacy policy or AI consent flow | High | Public beta |
| No verified deployment security headers | Medium/High | Public deployment |

---

## 10. Stage 2 Decision Questions

Stage 2 must convert these questions into explicit product requirements.

### 10.1 Product scope

1. What is the exact promise of Study Buddy Hub Web v1?
2. Which existing features are essential for private beta?
3. Which features should be postponed to prevent scope overload?
4. Should chapter deadlines remain in beta?
5. Should exams and reminders remain, be simplified, or be postponed?
6. Should AI daily focus and study summaries remain in the first public version?
7. Should streaks, milestones, and reflections be retained?

### 10.2 Subject model

1. Users are expected to choose or type between 1 and 7 subjects during account setup.
2. Should subjects be fully user-created, selected from a catalogue, or both?
3. Should syllabus metadata be reusable/shared globally while user progress remains private?
4. How should different exam boards, qualifications, syllabuses, and years be represented?
5. How should duplicate subject names or repeated syllabus uploads be handled?

### 10.3 Cloud and offline model

1. Should the product remain local-first with cloud sync, or become cloud-first with local caching?
2. Which data must work offline?
3. How are conflicts resolved if a user edits the same record on two devices?
4. What data remains local-only, such as appearance preferences?
5. What happens to the current offline sync queue?

### 10.4 AI model

1. Should the app provide AI usage or require users to provide their own keys?
2. What free usage allowance is financially sustainable?
3. Is Gemini the preferred primary document extractor after controlled testing?
4. Is Groq needed for cleanup, validation, or lower-cost text tasks?
5. What happens when AI extraction is incomplete?
6. How are uploaded documents classified before extraction?
7. What provider consent and privacy wording is required?

### 10.5 Backups and portability

1. Should manual backup/export remain after cloud migration?
2. Should import merge or replace data?
3. Should backups be encrypted?
4. Which data must be exportable for user portability?
5. How are cloud backups and manual exports distinguished?

### 10.6 Technical questions

1. Why are component definitions split across two stores, and which model should survive?
2. How should component IDs be generated and enforced?
3. How should syllabus bullets, topics, and chapters be represented relationally?
4. How much of `storage.ts` should be replaced or split?
5. What migration path preserves current user data?
6. What should become a database constraint instead of client deduplication?
7. Which package manager will be the single standard?

---

## 11. Provisional Public-Beta Scope

This section is provisional and must be finalized during Stage 2.

### 11.1 Likely must-have capabilities

- account creation and login;
- account setup with 1–7 subjects;
- subject creation or selection;
- cloud-backed syllabus progress;
- reliable CSV import;
- secure AI syllabus PDF extraction;
- editable extraction preview;
- syllabus confidence tracking;
- past-paper logging;
- component metadata;
- component and paper analytics;
- responsive web interface;
- user data export;
- error handling and monitoring;
- privacy and AI disclosure;
- secure Vercel deployment;
- automated tests for core flows.

### 11.2 Likely should-have capabilities

- PWA installation;
- limited offline caching;
- simplified dashboard readiness and next actions;
- sample data or guided onboarding;
- basic reminders;
- progress history;
- user-controlled theme and accessibility settings.

### 11.3 Likely candidates for postponement

These are not final removal decisions:

- complex chapter deadlines;
- full exam scheduling and notification orchestration;
- Google Calendar integration;
- advanced gamification;
- leaderboards;
- social/community functionality;
- advanced AI coaching;
- native desktop and mobile-store apps.

---

## 12. Priority Roadmap After Stage 1

### Priority 0 — Stabilize the current codebase

Before major architecture changes:

- resolve the six failing tests;
- investigate CSS build warnings;
- address important React hook dependency warnings;
- choose one package manager and lockfile;
- document the current baseline;
- ensure the project builds from a clean installation.

### Priority 1 — Finalize Stage 2 requirements

- define web v1 product promise;
- freeze private-beta scope;
- decide postponed features;
- define first-time user journey;
- define the 1–7 subject setup model;
- define retention or removal of deadlines, exams, reminders, streaks, and AI summaries;
- define acceptance criteria.

### Priority 2 — Design production architecture

- authentication;
- user profiles;
- cloud database schema;
- ownership fields and RLS;
- component-model reconciliation;
- migration strategy;
- offline/cache strategy;
- backup and export strategy;
- secure AI proxy;
- cost and rate-limit design.

### Priority 3 — Implement one vertical production slice

Recommended first vertical slice:

1. sign up/login;
2. create or select subjects;
3. store subject data in the cloud;
4. load the same subject on another device;
5. verify user data isolation;
6. migrate existing local subject data safely.

Do not migrate every feature simultaneously.

### Priority 4 — Reinforce import and AI extraction

- standardize the CSV pipeline;
- secure AI requests behind backend functions;
- classify documents;
- support long PDFs without silent truncation;
- preserve layout or use native document-understanding models;
- validate and merge chunks;
- retain source-page references where practical;
- preserve extraction confidence and component metadata;
- add consent and failure handling.

### Priority 5 — Redesign onboarding and core UX

- one clear first action;
- progressive dashboard;
- clear import path;
- mobile navigation;
- fix past-paper modal and dropdown behaviour;
- explain components;
- improve empty states;
- reduce redundant sections;
- separate user settings from developer diagnostics.

### Priority 6 — Automated QA and CI

- Playwright E2E tests;
- GitHub Actions;
- build, lint, test, and type-check gates;
- core flow regression tests;
- mobile viewport tests;
- accessibility tests;
- backup round-trip tests;
- auth and RLS tests;
- AI failure and rate-limit tests.

### Priority 7 — Private beta preparation

- error monitoring;
- analytics limited to necessary product insights;
- feedback route;
- privacy policy;
- terms or beta disclaimer;
- account/data deletion;
- user export;
- support contact;
- production security headers;
- controlled small tester group.

---

## 13. Stage 1 Conclusion

The Stage 1 audit supports continuing from the existing Study Buddy Hub repository.

A complete rebuild is not justified. The application has substantial working value in its syllabus tracking, CSV import, past-paper logging, analytics, backups, themes, PWA support, and local-first usability.

However, the current architecture was designed for personal browser use rather than a public multi-user service. The major challenge is therefore not adding more visible features. It is converting the existing system into a coherent, secure, tested, user-scoped web product.

Stage 1 is complete when:

- this consolidated plan is reviewed by the project owner;
- technical claims are verified against the repository;
- corrections are incorporated;
- the approved document is committed to the repository.

Stage 2 should then define and freeze the exact requirements for Study Buddy Hub Web v1 Private Beta and Public Beta.

---

## 14. Stage 1 Approval Checklist

- [ ] Current feature descriptions accurately represent the app.
- [ ] Proposed removals/postponements are clearly marked as decisions for Stage 2.
- [ ] Web-first Vercel scope is correct.
- [ ] 1–7 subject account-setup direction is correct.
- [ ] Architecture and persistence findings are verified.
- [ ] Testing results are still current.
- [ ] Security findings distinguish personal use from public deployment.
- [ ] No API keys or secrets appear in this document.
- [ ] Open questions have not been incorrectly presented as final decisions.
- [ ] Final corrected file is saved as `docs/STUDY_BUDDY_HUB_REVIVAL_PLAN.md`.
- [ ] Final file is committed to GitHub.
