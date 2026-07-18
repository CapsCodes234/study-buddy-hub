# Study Buddy Hub — Stage 2 Requirements and Scope

**Status:** Updated Stage 2 requirements with hybrid notifications
**Stage:** Stage 2 — Requirements Definition and Scope Freeze  
**Initial release:** Web application on Vercel  
**Direction:** Cloud-first, multi-user, locally cached PWA

---

## 1. Purpose

This document converts the Stage 1 audit and the project owner’s Stage 2 decisions into a defined scope for Study Buddy Hub Web v1.

Stage 2 must determine:

- what the product promises;
- which features are required for private and public beta;
- which features are simplified or postponed;
- how subjects, syllabus data, user progress, AI, cloud sync, offline use, backups, and migration should behave;
- the acceptance criteria that must be met before implementation is considered complete.

This is a requirements document, not the final database or API design.

---

## 2. Product Vision

### 2.1 Web v1 promise

Study Buddy Hub Web v1 helps CAIE A-Level students securely organise and track syllabus progress, record and analyse past-paper performance, identify personalised study priorities, and receive AI-assisted daily focus and study summaries across devices through secure cloud accounts.

### 2.2 Initial audience

The first official release will focus on **CAIE A-Level students**.

Future rollouts may include:

1. CAIE IGCSE;
2. Pearson Edexcel;
3. AQA;
4. International Baccalaureate;
5. other exam boards and qualifications.

These later qualifications are outside the first private-beta scope.


### 2.3 Design audience and identity

Study Buddy Hub will be designed primarily for secondary-school and sixth-form students while remaining suitable for adult learners and private candidates.

The interface must feel:

- modern;
- focused;
- motivating;
- academically credible;
- visually distinctive;
- easy to understand without appearing childish.

The product must not resemble a generic administrative dashboard. Its visual identity should use:

- strong typography;
- purposeful subject accents;
- clear hierarchy;
- meaningful progress visualisations;
- restrained motion;
- consistent iconography;
- accessible light and dark themes.

Visual engagement must not depend on excessive gradients, animation, gamification, dense card layouts, or distracting colour competition.


---

## 3. Decision Status

### 3.1 Confirmed decisions

- The product will be cloud-first with local caching.
- Users will have secure accounts and synchronised data across devices.
- Account access will support a password-based account with a unique username and email for verification or recovery, plus sign-in with Google, Microsoft, or Apple.
- Users may select catalogue subjects or create custom subjects.
- Each user may have between 1 and 7 active subjects.
- Syllabus metadata may be shared globally, while each user’s progress remains private.
- Initial official support is CAIE A-Level.
- Syllabus and past-paper workflows must support offline use.
- Study Buddy Hub will provide AI access; users will not enter provider API keys.
- AI Daily Focus and AI Study Summary will remain.
- Streaks, milestones, and reflections will remain.
- Chapter deadlines will remain only as a basic foundation during the first release.
- Exams and reminders will be redesigned around future external-calendar integration.
- Manual backups will remain and should be encrypted.
- Repeated syllabus uploads must be compared with existing syllabus content before changes are applied.
- Gemini is the provisional primary syllabus extraction provider, subject to controlled benchmarking.
- Zod will validate all structured AI output.
- Groq may serve as an optional repair, lightweight-generation, and fallback provider where benchmarking confirms a clear benefit.
- OpenRouter belongs to the legacy implementation and is not required for the new production architecture.
- Study Buddy Hub will use a student-focused but mature visual identity that remains suitable for adult learners.
- The interface will prioritise clarity, accessibility, and progressive disclosure over dense dashboard layouts.
- End-user actions will use high-contrast filled or bordered buttons; ghost buttons will not be used.
- Supabase remains the approved backend direction; Firebase will not be introduced as a parallel production backend.
- Development and private-beta operation will follow a free-tier-first, cost-controlled strategy.
- Supabase will remain the authoritative source for notification records, preferences, schedules, delivery history, and user ownership.
- Firebase Cloud Messaging will be used only as the push-notification delivery provider; Firebase Authentication, Firestore, and Firebase Storage will not be introduced as parallel production systems.
- Google Calendar integration will remain a separate optional integration and will not depend on Firebase Cloud Messaging.
- Application-generated email notifications will be delivered to a user's verified email address through a provider-agnostic email channel; receiving email at a Gmail address does not require direct Gmail API access.
- Direct Gmail-account integration, such as sending on a user's behalf or accessing mailbox data, is a separate optional feature and remains outside the initial private-beta scope.
- Google sign-in, Google Calendar access, and any future Gmail access will use separate permissions requested only when the related feature is enabled.

### 3.2 Approved direction decisions

- Private beta should prioritise accounts, cloud data, syllabus tracking, past-paper tracking, AI extraction, safe migration, and responsive use.
- Full Google Calendar integration and advanced reminders should be postponed.
- The current offline queue stub should be replaced.
- Stale edits should produce a conflict rather than silently overwrite newer cloud data.
- Gemini should be tested as the provisional document-extraction provider.
- Groq should remain optional and may operate as a fallback for compatible repair, normalisation, and lightweight-generation tasks where testing proves a clear benefit.
- Import should merge with preview by default; full replacement should require separate confirmation.
- The two current component models should be unified.
- Cloud records should use UUIDs or an equivalent globally unique identifier.
- The current storage layer should be split gradually rather than rewritten in one large change.
- npm will become the sole supported package manager. `package-lock.json` will remain the canonical lockfile. `bun.lock` will be removed only after confirming that no development, CI, build, or deployment workflow uses Bun for dependency installation.
- Supabase is the proposed platform for authentication, PostgreSQL, Row Level Security, and protected backend functions; Vercel remains the hosting platform.

---

## 4. Private-Beta Scope

### 4.1 Must-have features

The private beta must include:

1. User registration, login, logout, and session handling.
2. Password-based account creation with a unique username and email for verification or recovery.
3. Sign-in with Google, Microsoft, and Apple.
4. Secure user-specific cloud data.
5. Account setup with 1 to 7 subjects.
6. Catalogue subject selection and custom subject creation.
7. Official CAIE A-Level subject support.
8. Cloud-backed syllabus tracking.
9. Confidence-state tracking and syllabus notes.
10. Reliable CSV syllabus import.
11. Secure AI-assisted PDF syllabus extraction.
12. Review and editing of extracted syllabus data before saving.
13. Past-paper attempt logging, editing, and deletion.
14. Exam-component configuration.
15. Past-paper and component analytics.
16. A simplified dashboard.
17. AI Daily Focus and AI Study Summary.
18. Streaks, milestones, and weekly reflections.
19. Responsive desktop, tablet, and mobile layouts.
20. PWA installation support.
21. Offline syllabus and past-paper access.
22. Synchronisation of supported offline changes.
23. Manual encrypted data export.
24. Migration of existing local Study Buddy Hub data.
25. Account data export and deletion.
26. Monitoring, error reporting, and feedback collection.

### 4.2 Foundation-only features

#### Chapter deadlines

The first release may include:

- a simple optional chapter deadline;
- cloud persistence;
- a calendar-ready data structure;
- basic display in the relevant syllabus area.

It will not require:

- advanced deadline planning;
- automated rescheduling;
- complex reminder logic;
- full Google Calendar synchronisation;
- heavy dashboard deadline orchestration.

#### Exams and reminders

The first release should preserve only the foundations required for future integration, such as:

- calendar-event records;
- reminder preferences;
- future external-calendar identifiers;
- notification integration points.

Full exam scheduling, automated reminders, and external-calendar synchronisation are postponed.

### 4.3 Out of scope

- Full Google Calendar integration.
- Advanced deadline automation.
- Full exam and reminder orchestration.
- CAIE IGCSE, Edexcel, AQA, IB, and other qualifications.
- Native mobile and desktop applications.
- Social feeds, messaging, leaderboards, and collaborative groups.
- Teacher, school, or institution accounts.
- Automated timetable generation.

---

## 5. Subject and Syllabus Requirements

### 5.1 Subject setup

During onboarding:

- a user must create or access an account before private cloud data is loaded;
- password-based registration must support a unique username and an email address for verification or recovery;
- users must also be able to sign in with Google, Microsoft, or Apple;
- a user must select or create at least 1 subject;
- a user must not exceed 7 active subjects;
- both catalogue and custom subjects must be supported;
- the interface must explain the subject limit;
- users must later be able to add, archive, or remove subjects with appropriate data warnings.

### 5.2 Shared and private data

Globally reusable academic data may include:

- exam board;
- qualification;
- subject;
- syllabus code and version;
- topics, subtopics, and learning outcomes;
- standard exam components.

Private user data must include:

- selected subjects;
- confidence states;
- notes;
- custom syllabus changes;
- past-paper attempts;
- reflections;
- streaks and milestones;
- deadlines;
- preferences.

A user must never be able to access another user’s private study data.

### 5.3 Repeated syllabus uploads

When a syllabus is uploaded for a subject that already contains syllabus data, the system must:

1. detect the existing syllabus;
2. compare the incoming version with the current version;
3. show added, removed, and changed items;
4. allow individual changes to be accepted or rejected;
5. allow accepted changes to be merged;
6. allow full replacement only after explicit confirmation;
7. allow cancellation without altering current data;
8. preserve notes, progress, and paper data for unchanged learning outcomes;
9. warn the user where existing progress cannot be matched safely.

Stable identifiers and structured matching should be used instead of relying only on visible text.

---

## 6. Cloud, Offline, and Synchronisation

### 6.1 Cloud-first model

The cloud database will be the authoritative source of user data.

Local storage or a local database may hold:

- cached cloud records;
- pending offline operations;
- temporary drafts;
- PWA state;
- device-specific preferences;
- temporary processing state.

### 6.2 Required offline workflows

While offline, a signed-in user must be able to:

- view cached syllabus content;
- update confidence states;
- add or edit syllabus notes;
- view cached past-paper attempts;
- create or edit past-paper attempts;
- see whether changes are waiting to synchronise.

### 6.3 Synchronisation behaviour

When connectivity returns:

- pending operations must be sent to the server;
- successful operations must update the local cache;
- failed operations must remain available for retry;
- unresolved conflicts must be shown to the user;
- the local cache must not replace the complete cloud state automatically.

### 6.4 Conflict resolution

**Approved workflow**

Each synchronised record should use a version number or equivalent update marker.

When two devices edit the same record:

- the first valid server update is accepted;
- a later update based on an outdated version is rejected;
- the rejected device shows a conflict;
- the user may keep the cloud version, reapply the local edit, or merge supported fields;
- newer data must never be overwritten silently.

Independent additions, such as two separate paper attempts, may both be appended when they do not modify the same record.

### 6.5 Local-only data

The following should remain local-only during Web v1 unless later changed:

- cached cloud data;
- pending offline operations;
- temporary drafts;
- browser notification permission;
- PWA installation state;
- reduced-motion and device-specific display preferences;
- temporary uploaded files;
- transient extraction state.

### 6.6 Offline queue

The current queue stub must be replaced by a production queue containing at least:

- operation ID;
- user ID;
- record type and ID;
- create, update, or delete operation;
- payload;
- base version;
- creation time;
- retry count;
- synchronisation status;
- failure or conflict reason.

---


### 6.7 Hybrid notification and external-integration architecture

Study Buddy Hub will use one notification domain with multiple delivery channels.

#### Source of truth

Supabase will store and enforce ownership for:

- notification records;
- notification preferences;
- device registrations;
- delivery attempts;
- reminder schedules;
- calendar integration records;
- email delivery status;
- user consent and integration status.

Firebase Cloud Messaging will not be the database or scheduler. It will receive protected send requests from a trusted server-side function and deliver push messages to supported web, PWA, and future mobile clients.

#### Channel adapters

The notification system should expose separate adapters for:

- in-app notifications;
- Firebase Cloud Messaging push notifications;
- application-generated email notifications;
- future Google Calendar event synchronisation;
- future direct Gmail integration only where explicitly approved.

A failure in one channel must not corrupt the notification record or block the other channels.

#### Google Calendar compatibility

Google Calendar integration must remain independent of FCM.

When implemented later:

- a user explicitly connects Google Calendar;
- only the minimum required Calendar permissions are requested;
- Study Buddy Hub creates or updates linked calendar events through a protected backend function;
- external event IDs and synchronisation status are stored in Supabase;
- revoked access or Calendar API failure does not remove the original Study Buddy Hub record;
- event creation must be idempotent to avoid duplicates;
- Calendar-native reminders and Study Buddy Hub push or email reminders must follow user preferences to prevent accidental duplicate alerts.

#### Email and Gmail compatibility

Study Buddy Hub may send application-generated emails to any verified email address, including Gmail, Outlook, or other providers, without connecting to the user's mailbox.

Direct Gmail API access is required only if a future feature needs to:

- send email from the user's own Gmail account;
- create Gmail drafts;
- read Gmail messages;
- inspect mailbox data;
- modify Gmail content or settings.

Those direct Gmail capabilities are not required for Web v1 private beta and must not be requested during ordinary sign-in.

#### Incremental permissions

Google sign-in must request only the permissions required for authentication.

Calendar or future Gmail permissions must be requested separately, in context, when the user enables that integration.

Tokens and refresh credentials for external integrations must:

- be handled through a secure server-side OAuth flow;
- never be exposed in the frontend bundle;
- be stored encrypted or in an appropriate secrets/credential store;
- support revocation and disconnection;
- be scoped to the minimum access required.

#### Complexity controls

To keep the system manageable:

- Supabase remains the only authoritative database;
- one notification dispatcher decides which channels apply;
- delivery providers remain replaceable adapters;
- each notification has a stable ID used for idempotency and deduplication;
- channel failures are logged independently;
- integrations are controlled by feature flags;
- the private beta starts with in-app notifications, FCM registration, test pushes, and essential system events;
- full calendar and email reminder automation remains postponed.


---

## 7. AI Requirements

### 7.1 Access model

- Study Buddy Hub supplies AI access.
- Users do not provide API keys.
- Provider secrets remain server-side.
- Requests pass through authenticated backend functions.
- Usage is rate-limited and measured per user.

### 7.2 Usage allowance

**Proposed — exact amount pending cost testing**

Each user will receive a configurable daily or periodic allowance.

The allowance must:

- be enforced by the backend;
- distinguish between low-cost and high-cost operations;
- avoid charging users for verified server or provider failures;
- be adjustable without redeploying the frontend;
- show remaining usage clearly.

The exact limit will be decided after measuring extraction cost, document size, retry frequency, and expected beta usage.

### 7.3 AI Daily Focus and Study Summary

Both remain in the first public version. They must:

- use only the signed-in user’s authorised data;
- explain when there is insufficient data;
- avoid unnecessary repeated calls;
- respect usage limits;
- present generated guidance as assistance rather than certainty.

### 7.4 Document extraction

**Approved provider strategy, with final model selection deferred to controlled testing**

Gemini should be tested as the provisional primary PDF/document extraction provider.

Testing must measure:

- completeness;
- hierarchy accuracy;
- table and multi-column handling;
- syllabus-code recognition;
- structured-output validity;
- scanned-document support;
- latency, cost, and failure recovery.

Zod must validate every structured extraction result. Groq remains optional and may be used for JSON repair, normalisation, lightweight generation, or as a compatible fallback when Gemini is unavailable or produces invalid output, but only where benchmarking proves that it improves reliability, speed, or cost. Groq is not assumed to replace Gemini's direct PDF capabilities unless testing confirms that role.

OpenRouter is part of the legacy implementation and is not required for the new production architecture.

### 7.5 Document classification

Before extraction, the system should identify:

- file type, size, and page count;
- whether selectable text exists;
- whether OCR may be required;
- likely exam board, qualification, subject, syllabus code, and year;
- whether the document is likely to be a syllabus;
- whether a similar syllabus already exists.

### 7.6 Incomplete extraction

AI output must not be saved automatically without user review.

When extraction is incomplete, the system must:

- warn the user;
- identify uncertain sections where possible;
- preserve successfully extracted sections;
- allow manual editing;
- allow retry, CSV fallback, or cancellation;
- avoid charging additional allowance for verified system failures.

### 7.7 Consent and privacy

Before the first AI document request, the user must be informed that:

- document content will be processed by a third-party AI provider;
- unnecessary personal or sensitive information should not be uploaded;
- extracted content must be reviewed before saving;
- provider processing and retention terms may apply.

Final legal wording must be reviewed before public beta.

---

## 8. Backup, Import, Export, and Portability

### 8.1 Manual export

Manual export remains for:

- user-controlled portability;
- independent recovery;
- migration;
- personal record keeping.

### 8.2 Import behaviour

**Approved behaviour**

Import should merge with preview by default.

Before import, the system should show:

- records to add;
- records to update;
- duplicates;
- conflicts;
- records that would be removed by full replacement.

Full replacement must be a separate action with a strong warning and explicit confirmation.

### 8.3 Encryption

Manual backup files must be encrypted or password-protected before public release.

The implementation must ensure:

- encryption occurs before the file leaves the application;
- the password or recovery secret is not stored inside the file;
- the user is warned that losing the password may make the backup unrecoverable.

### 8.4 Exportable data

Users should be able to export:

- appropriate profile information;
- subjects and custom subjects;
- syllabus versions and custom syllabus data;
- confidence progress and notes;
- component configurations;
- past-paper attempts;
- reflections;
- streak and milestone history;
- settings;
- deadline and calendar data when active.

Exports must not include provider secrets, server credentials, another user’s data, or unnecessary internal logs.

### 8.5 Definitions

- **Cloud persistence:** live account data used by the application.
- **Provider backup:** infrastructure recovery managed by the cloud platform.
- **Manual export:** a user-triggered portable copy.
- **Manual import or restore:** a user-triggered recovery or migration action.

---

## 9. Approved Technical Direction

These decisions are approved as the Stage 2 technical direction. Stage 3 must convert them into a detailed architecture and implementation plan and verify feasibility before production changes begin.

### 9.1 Component model

The two current component representations should become one canonical exam-component model containing:

- stable ID;
- subject or syllabus-version relationship;
- component name and paper code;
- duration, marks, and weighting;
- display order;
- standard or user-created source;
- ownership rules for custom records.

### 9.2 Identifiers

Cloud records should use UUIDs or an equivalent globally unique identifier. Supported offline-created records should receive their IDs before synchronisation.

### 9.3 Relational syllabus structure

The future model should separate:

- exam boards;
- qualifications;
- subjects;
- syllabuses and syllabus versions;
- topics, subtopics, and learning outcomes;
- exam components;
- user subjects;
- user progress and notes;
- past-paper attempts.

Shared academic data must not directly contain private user progress.

### 9.4 Storage migration

The current `storage.ts` responsibilities should be split gradually into domain repositories or services for:

- subjects;
- syllabuses;
- progress;
- components;
- paper attempts;
- settings;
- backup and restore;
- offline synchronisation.

A single large rewrite should be avoided.

### 9.5 Existing-data migration

When an existing local user signs in:

1. local Study Buddy Hub data is detected;
2. migration is offered rather than performed silently;
3. a local backup is created first;
4. the data is validated;
5. a migration summary is shown;
6. valid data is mapped to the cloud model;
7. relationships and counts are verified;
8. failures do not destroy original data;
9. completed migration is recorded;
10. local data becomes cache rather than the authoritative source.

### 9.6 Database integrity

The database should enforce:

- user ownership and Row Level Security;
- foreign-key relationships;
- unique record IDs;
- valid syllabus and component relationships;
- allowed confidence states;
- valid score ranges;
- non-negative marks and durations;
- safe deletion behaviour;
- domain-specific uniqueness rules.

Client validation and deduplication remain useful but must not be the only protection.

### 9.7 Package manager

npm will become the sole supported package manager. `package-lock.json` will remain the canonical lockfile. `bun.lock` must be removed only after confirming that no development, CI, build, or deployment workflow uses Bun for dependency installation.

The supported Node.js and npm versions must be documented and used consistently in local development and CI.

### 9.8 Approved platform direction

- Frontend: existing React, TypeScript, and Vite application.
- Hosting: Vercel.
- Authentication and database: Supabase.
- Access control: Row Level Security.
- Protected AI operations: Supabase Edge Functions or Vercel serverless functions.
- Server-state access: TanStack Query.
- Validation: Zod.

No full frontend rewrite is required.


### 9.9 Technology standards

- npm is the sole supported package manager after Bun workflow verification.
- `package-lock.json` is the canonical dependency lockfile.
- Supabase is the approved backend direction for authentication, PostgreSQL, Row Level Security, and private user data.
- Vercel remains the frontend hosting platform.
- Firebase will not be introduced as a parallel production backend.
- React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, and Zod remain the approved frontend and application tooling unless Stage 3 identifies a blocking technical reason to change them.


---


### 9.10 Notification and integration platform boundaries

Approved platform roles:

| Platform or service | Approved role |
|---|---|
| Supabase | Authentication, PostgreSQL data, Row Level Security, notification source of truth, preferences, schedules, integration records, delivery history, and protected functions |
| Firebase Cloud Messaging | Push-notification delivery only |
| Vercel | Frontend and PWA hosting |
| Google Calendar API | Optional future event synchronisation |
| Email delivery provider | Application-generated transactional and reminder emails |
| Gmail API | Optional future direct Gmail-account integration only; not required for ordinary email delivery |

The architecture must not duplicate user, reminder, or notification records across Supabase and Firestore.


---

## 10. UI/UX and Interaction Requirements

### 10.1 Design system

The application must use a consistent design system covering:

- typography;
- spacing;
- card styles;
- border radius;
- iconography;
- button hierarchy;
- form controls;
- loading states;
- success and error feedback;
- subject accent colours;
- light and dark modes.

Primary, secondary, destructive, disabled, and selected states must be visually distinguishable.

End-user buttons must use high-contrast filled or bordered styles. Ghost-style buttons must not be used for end-user actions.

### 10.2 Navigation

Navigation must:

- clearly separate global pages from subject-specific pages;
- avoid horizontal overflow on phones;
- use an appropriate mobile navigation pattern such as a menu, drawer, or bottom navigation;
- provide visible labels for Settings and accessibility controls;
- avoid redundant breadcrumbs on top-level pages;
- preserve the user's location or context when returning from a detail view.

### 10.3 Dashboard hierarchy

The dashboard must prioritise:

1. Today’s Focus;
2. Next Action;
3. readiness or progress summary;
4. essential subject status;
5. advanced analytics only when sufficient data exists.

The dashboard must not show a large wall of equally prominent cards.

Advanced or empty analytics sections should:

- remain hidden until enough data exists;
- collapse into a clear empty state;
- avoid repeated zero-value cards;
- avoid unbounded list growth;
- remain readable on small screens.

### 10.4 Onboarding

Onboarding must:

- use the current four confidence states;
- explain the product in plain language;
- end with one clear next action;
- guide the user toward account setup and first subject setup;
- provide direct access to syllabus import;
- explain what an exam component is before requiring it;
- explain cloud sync and offline behaviour;
- disclose AI document processing before the first AI request;
- support dismissal and later re-entry where appropriate.

An optional demonstration-data mode or guided sample may be included if it does not interfere with real user data.

### 10.5 Empty states

Every major empty state must:

- explain why no data is shown;
- tell the user what to do next;
- provide a direct action where possible;
- avoid presenting the app as broken;
- hide irrelevant filters and analytics until data exists.

Examples include:

- empty syllabus;
- no paper components;
- no past-paper attempts;
- no AI history;
- no reflections;
- no cached offline data.

### 10.6 Forms and dialogs

Forms and dialogs must:

- remain fully usable at widths of 375px and above;
- prevent content from appearing behind fixed headers or footers;
- keep dropdowns within the viewport;
- distinguish required and optional fields;
- disable submission until required data is valid;
- preserve unsaved input during recoverable failures where possible;
- use confirmation dialogs only for destructive or irreversible actions;
- avoid unnecessary number-input spinner controls where unsuitable.

### 10.7 Feedback and system states

The interface must provide clear states for:

- loading;
- success;
- failure;
- offline use;
- synchronisation pending;
- synchronisation completed;
- conflict detected;
- rate limit reached;
- AI extraction incomplete;
- temporary service outage.

Loading skeletons may be used for data-dependent pages.

Unexpected failures must display a recoverable fallback state rather than a blank or broken screen.

Fallback states must:

- explain the issue in plain language;
- preserve unsaved local work where possible;
- offer safe retry, return, or support actions;
- state that the issue has been reported only when monitoring confirms that report;
- avoid claiming that the problem has been fixed before recovery is confirmed.

### 10.8 Accessibility

Core workflows must support:

- keyboard navigation;
- visible focus indicators;
- accessible names and labels;
- sufficient colour contrast;
- reduced motion;
- screen-reader-compatible form controls;
- touch targets suitable for phone use;
- readable text scaling;
- accessible error messages;
- dialogs that remain usable on small screens.

### 10.9 Motion and polish

Motion must be restrained and purposeful.

Acceptable uses include:

- expanding and collapsing syllabus sections;
- loading transitions;
- page or card transitions;
- milestone celebration feedback.

Motion must:

- never block interaction;
- respect reduced-motion preferences;
- avoid excessive bouncing, flashing, or distraction;
- not substitute for clear information hierarchy.

### 10.10 UI/UX items requiring limited implementation planning

The following may be included where they remain low-risk:

- downloadable sample CSV;
- optional demonstration data;
- user-dismissible onboarding guidance;
- local draft preservation;
- conflict-resolution dialogs;
- global fallback error pages.

The following remain out of scope for Web v1:

- social feeds;
- collaborative study rooms;
- leaderboards;
- user-customisable dashboard widget systems;
- full-app AI chat;
- advanced Google Calendar synchronisation;
- teacher or institution portals;
- complex notification automation.

---

## 11. Non-Functional Requirements

### 11.1 Security and privacy

Before private multi-user beta:

- authentication must be active;
- all private records must be user-scoped;
- access policies must be tested;
- AI secrets must be server-side;
- rate limits must be enforced;
- imports must be validated;
- sensitive actions must require confirmation.

Before public beta:

- a privacy policy must exist;
- AI processing must require disclosure and consent;
- users must be able to export and delete their data;
- only necessary personal data should be collected.

### 11.2 Reliability

- Failed synchronisation must not silently lose data.
- Failed AI calls must not silently consume usage.
- Migration must preserve original local data until verified.
- Cloud errors must produce understandable messages.
- Failed imports and restores must provide recovery paths.
- Unexpected application failures and temporary service outages must display a clear fallback state instead of a blank or broken page.
- The fallback state must explain that the application is temporarily unable to complete the action, preserve unsaved local work where possible, and provide safe retry, return, or support options.
- When automatic monitoring has successfully reported the problem, the fallback state may reassure the user that the issue has been reported and is being handled in the background.
- The interface must not falsely claim that an issue has been reported or fixed when monitoring cannot confirm this.
- Push delivery must supplement rather than replace in-app notification history.
- A failed FCM delivery must not delete or mark the underlying notification as completed.
- Calendar, push, and email channels must use idempotency and deduplication controls.
- Revoking one external integration must not prevent the user from using the rest of Study Buddy Hub.

### 11.3 Performance and accessibility

- The dashboard must not block on unnecessary AI calls.
- Large syllabus lists must remain usable.
- File limits must protect the browser and backend.
- Core workflows must be responsive on phones, tablets, and desktops.
- Keyboard navigation, focus states, contrast, reduced motion, accessible labels, and small-screen dialogs must be supported.
- Buttons must have strong visual contrast from their surrounding page or card.
- End-user actions must use clearly visible filled or bordered button styles; ghost-style buttons must not be used in the end-user interface.
- Primary, secondary, destructive, and disabled actions must remain visually distinguishable in both light and dark modes.

### 11.4 Quality assurance

Before public beta:

- current failing tests must be resolved;
- build, lint, test, and type-check checks must run in CI;
- critical workflows must have automated tests;
- Playwright or equivalent E2E tests must cover core journeys;
- user-isolation and security tests must exist;
- production errors must be monitored.

---


### 11.5 Cost control

Study Buddy Hub will follow a free-tier-first and cost-controlled development strategy.

Requirements:

- private-beta operation should remain within no-cost service allowances where practical;
- paid services must not be enabled without documented need and project-owner approval;
- database, storage, bandwidth, server-function, and AI usage must be monitored separately;
- spending alerts and usage alerts must be configured before public access;
- AI features must use quotas and server-side enforcement;
- expensive features must support feature flags or emergency disablement;
- repeated AI results should be cached where appropriate;
- AI summaries must not regenerate automatically on every page load;
- the private beta must define a maximum approved operating budget;
- free-tier assumptions must be reviewed before public beta.
- FCM, email, Calendar API, and server-function usage must be monitored separately;
- direct Gmail API integration must not be added without a confirmed product need because it increases OAuth, privacy, verification, and support complexity.


---

## 12. Private-Beta Acceptance Criteria

The private-beta implementation is acceptable when:

1. A user can register using a password-based account with a unique username and email for verification or recovery.
2. A user can sign in with Google, Microsoft, or Apple.
3. A user can select or create between 1 and 7 subjects.
4. The same account data can be loaded on another device.
5. One user cannot access another user’s private records.
6. A user can import CAIE A-Level syllabus content through CSV.
7. A supported PDF can be processed through a secure server-side AI flow.
8. Extracted content can be reviewed and edited before saving.
9. A repeated syllabus upload can be compared before merge or replacement.
10. A user can update confidence states and notes.
11. A user can log, edit, and delete past-paper attempts.
12. Analytics update correctly after paper changes.
13. AI Daily Focus and Study Summary respect usage limits.
14. Cached syllabus and paper data can be viewed offline.
15. Supported offline edits synchronise after reconnection.
16. A stale second-device edit does not silently overwrite newer data.
17. Existing local data can be migrated after user confirmation.
18. A user can create an encrypted manual export.
19. A user can request account and private-data deletion.
20. Core navigation and dialogs work on supported screen sizes.
21. A simulated unexpected application error displays the approved fallback state with retry or recovery options.
22. All end-user buttons use approved high-contrast filled or bordered styling without ghost buttons.
23. Mobile navigation works without horizontal overflow.
24. Empty states contain a clear explanation and direct next action.
25. Dialog content and controls remain visible and usable at 375px width.
26. Advanced dashboard analytics remain hidden until sufficient data exists.
27. Core workflows can be completed using keyboard navigation.
28. Reduced-motion preferences are respected.
29. A user can grant or deny push-notification permission without losing access to the application.
30. A signed-in user can register and revoke their own notification device.
31. A protected backend function can send a test push through FCM without exposing sending credentials to the browser.
32. A failed push remains visible in notification history with a retryable or failed status.
33. Google sign-in does not automatically grant Google Calendar or Gmail permissions.
34. Calendar or future Gmail permissions are requested only when the user enables the related integration.
35. The notification model prevents duplicate delivery of the same channel event through idempotency controls.
36. The application can send a normal account or reminder email to a verified Gmail address without requiring mailbox access.
37. CI passes required build, test, lint, and type-check gates.

---



## 13. Remaining Open Decisions

1. Exact AI allowance.
2. Final AI provider after benchmarking.
3. Exact Groq fallback, repair, and lightweight-generation triggers after benchmarking.
4. Exact list of prepared CAIE A-Level subjects for private beta.
5. Exact visible behaviour of the chapter-deadline foundation.
6. Whether exam/calendar foundations appear in the UI or remain data-layer only.
7. Final encrypted-backup user experience.
8. Final conflict-resolution interface.
9. Whether Supabase Edge Functions or Vercel functions handle each protected operation.
10. Whether theme preferences synchronise across devices.
11. Whether weekly reflections are required on day one of private beta or may follow shortly afterward.
12. Size and membership of the first private-beta group.
13. Exact private-beta notification event types.
14. Notification-history retention period.
15. Whether FCM test notifications launch on day one of private beta or in a controlled follow-up.
16. Transactional email provider for application-generated emails.
17. Exact Google Calendar permissions and synchronisation behaviour for the later calendar phase.
18. Whether direct Gmail integration will ever be required beyond delivering normal emails to Gmail addresses.

---

## 14. Stage 2 Approval Checklist

### Product and scope

- [x] Product promise is correct.
- [x] CAIE A-Level is the correct initial qualification.
- [x] The 1–7 subject rule is correct.
- [x] Catalogue and custom subjects are both required.
- [x] Private-beta must-have list is approved.
- [x] Username/password-based account setup and Google, Microsoft, and Apple sign-in are approved.
- [x] Foundation-only and postponed features are correctly classified.

### Cloud and data

- [x] Cloud-first with local caching is approved.
- [x] Offline syllabus and paper requirements are correct.
- [x] Proposed conflict behaviour is acceptable.
- [x] Shared syllabus metadata and private user data are correctly separated.
- [x] Existing-data migration flow is acceptable.
- [x] Proposed Supabase and Vercel direction is acceptable.

### AI

- [x] App-provided AI access is correct.
- [x] Configurable usage allowances are correct.
- [x] Gemini remains provisional until testing.
- [x] Groq remains optional.
- [x] AI consent and incomplete-extraction requirements are acceptable.

### Backup and technical direction

- [x] Manual encrypted export remains.
- [x] Merge-with-preview is the default import behaviour.
- [x] Full replacement requires explicit confirmation.
- [x] Component models should be unified.
- [x] UUIDs are acceptable.
- [x] Storage migration should be gradual.
- [x] npm should become the standard package manager.
- [x] No full frontend rewrite is required.
- [x] Global fallback error states are required.
- [x] High-contrast buttons are required and ghost buttons are excluded from the end-user interface.


### UI/UX, cost, and technology additions

- [x]  Student-focused but mature design direction is approved.
- [x]  Distinctive visual identity requirements are approved.
- [x]  Mobile navigation and progressive dashboard requirements are approved.
- [x]  Onboarding, empty-state, form, dialog, and fallback-state requirements are approved.
- [x]  High-contrast button and no-ghost-button requirement is approved.
- [x]  Accessibility and reduced-motion requirements are approved.
- [x]  Free-tier-first and cost-control requirements are approved.
- [x]  Supabase-over-Firebase technology direction is approved.

### Hybrid notifications and external integrations

- [x]  Supabase remains the notification source of truth.
- [x]  Firebase Cloud Messaging is approved for push delivery only.
- [x]  Firebase Authentication, Firestore, and Firebase Storage remain outside the production architecture.
- [x]  Push notifications supplement rather than replace in-app notification history.
- [x]  Google Calendar remains a separate optional integration.
- [x]  Google sign-in does not automatically grant Calendar or Gmail permissions.
- [x]  Application-generated email can be sent to Gmail addresses without direct Gmail API access.
- [x]  Direct Gmail-account integration remains outside the private-beta scope.
- [x]  Multi-channel deduplication, idempotency, and independent failure handling are approved.
- [x]  Full Calendar and email reminder automation remains postponed.

### Completion

- [x]  Remaining decisions are answered or deliberately deferred.
- [x]  Functional and non-functional requirements are approved.
- [x]  Acceptance criteria are approved.
- [x]  Final file is saved as `docs/STUDY_BUDDY_HUB_STAGE_2_REQUIREMENTS.md`.
- [x]  Final file is committed to GitHub.

---


## 15. Official Technical Reference Notes

The Stage 3 architecture should verify implementation details against the current official documentation for:

- Firebase Cloud Messaging for web and service-worker-based delivery;
- Firebase's trusted server environment and FCM HTTP v1 sending model;
- Supabase Edge Functions, authentication, secrets, scheduling, and third-party integrations;
- Google Calendar API events, OAuth scopes, and quotas;
- Google OAuth incremental authorisation and offline access;
- Gmail API scopes and verification requirements.

These references support the approved separation between authentication, calendar access, Gmail access, notification storage, and push delivery.

---

The next SDLC stage should convert this approved scope into a detailed production architecture, notification and external-integration design, UI/UX implementation plan, cost-control plan, and phased implementation roadmap.
