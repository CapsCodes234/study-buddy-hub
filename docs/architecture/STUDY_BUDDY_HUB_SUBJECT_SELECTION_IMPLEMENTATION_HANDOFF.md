# Study Buddy Hub — Subject Selection Implementation Handoff

**Status:** Approved plan only — implementation has **not** started  
**Branch:** `feat/supabase-database-foundation`  
**Purpose:** Persistent handoff for Cursor/other coding agents to resume the authenticated subject-selection checkpoint safely.

---

## 1. Current Project State

The following foundation is already complete and tested:

- Local Supabase development environment using Docker.
- Ordered database migrations and seed data.
- Database linting and pgTAP coverage.
- Maximum-seven-active-subject concurrency test.
- Generated Supabase TypeScript database types.
- Typed Supabase client.
- Supabase authentication:
  - sign-up
  - sign-in
  - session restoration
  - protected routes
  - sign-out
- Automatic `public.profiles` creation from `auth.users`.
- Database-backed profile loading.
- Database-backed onboarding status.
- Account menu using database profile data.
- Cross-browser onboarding persistence.
- TypeScript and production build validation passed for the completed checkpoints.

Do not redo completed foundation work unless inspection demonstrates a defect.

---

# 2. Subject-Selection Goal

Implement **only the authenticated subject-selection foundation**.

The long-term architecture is:

```text
Exam Board
   ↓
Qualification
   ↓
Catalogue Subjects
   ↓
User Subject Selection
   ↓
Syllabus / Syllabus Version
```

The current development dataset contains Cambridge International AS & A Level Mathematics, Physics and Information Technology, but the UI and data-access layer must be generic and able to support a much larger catalogue later.

The current three seeded subjects are development data only.

---

# 3. Confirmed Inspection Findings

## Frontend state and routing

`useAppState` loads the full `AppState` from localStorage, performs integrity checks, and auto-saves state changes after initial load.

The application currently stores:

- subjects
- bullets
- past papers
- settings

under the local `study-tracker-data` state.

Legacy defaults currently exist:

```typescript
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', color: 'hsl(222, 47%, 20%)' },
  { id: 'physics', name: 'Physics', color: 'hsl(173, 58%, 39%)' },
  { id: 'it', name: 'Information Technology', color: 'hsl(38, 92%, 50%)' },
];
```

The current UI uses stable string subject IDs throughout the application.

Examples:

```text
math
physics
it
```

These IDs are used by:

- routes
- navigation
- bullets
- past papers
- themes
- imports
- backups
- chapter planning
- components
- progress calculations

Routes currently include:

```text
/:subjectId
/:subjectId/syllabus
/:subjectId/papers
```

Supabase UUIDs must therefore **not** replace these UI IDs during this checkpoint.

TanStack Query is already installed and its provider exists, but subject hooks do not yet use it.

---

# 4. Confirmed Database Model

## `catalogue_subjects`

Contains:

- UUID primary key
- `code`
- `slug`
- `name`
- `qualification_id`
- `is_active`

Catalogue subjects are canonical shared records.

## `user_subjects`

Contains:

- UUID primary key
- `user_id`
- exactly one of:
  - `catalogue_subject_id`
  - `custom_subject_id`
- optional `syllabus_version_id`
- `display_name_override`
- `sort_order`
- `is_archived`
- `deleted_at`
- `version`
- `client_operation_id`

Database constraints/indexes prevent duplicate active catalogue/custom selections.

## `custom_subjects`

Private per-user custom subject definitions.

## Approved subject RPCs

- `create_user_subject(...)`
- `set_user_subject_archived(...)`
- `soft_delete_user_subject(...)`
- `soft_delete_custom_subject(...)`
- `update_custom_subject_if_version(...)`

Normal `user_subjects` writes must use approved RPCs.

## Subject limit

Database trigger enforces a maximum of seven active subjects.

Expected error:

```text
A maximum of seven active subjects is allowed
```

## RLS

- catalogue data: authenticated read
- `user_subjects`: owner select
- custom subjects: owner select/insert
- controlled mutations use RPCs

---

# 5. Stable Subject Identity Rules

## Catalogue subjects

Legacy mappings must remain:

| Catalogue slug | UI `Subject.id` |
|---|---|
| `mathematics` | `math` |
| `physics` | `physics` |
| `information-technology` | `it` |

Future catalogue subjects may use their URL-safe catalogue slug directly as the UI ID.

Example:

```text
economics → economics
computer-science → computer-science
```

Database UUIDs must be retained separately.

## Custom subjects

Use:

```text
custom-{fullCustomSubjectUuid}
```

Do not shorten the UUID.

The ID must remain stable across:

- browsers
- devices
- renaming

---

# 6. Extended `Subject` Model

The existing UI fields remain unchanged.

Conceptually:

```typescript
export interface Subject {
  id: string;
  name: string;
  color: string;
  weight?: number;

  userSubjectId?: string;
  catalogueSubjectId?: string;
  customSubjectId?: string;
  syllabusVersionId?: string | null;
  catalogueCode?: string | null;
  catalogueSlug?: string | null;
  source?: 'catalogue' | 'custom' | 'local';
  sortOrder?: number;
  version?: number;
}
```

Confirm exact fields against generated Supabase types during implementation.

Extend the validation schema with matching optional properties so imports/backups remain compatible.

---

# 7. Authority Model

Two subject representations intentionally coexist during this transition.

| Representation | Source | Role |
|---|---|---|
| `resolvedSubjects` | Supabase `user_subjects` + joins | Authoritative authenticated UI selection |
| legacy `state.subjects` | localStorage | Compatibility/recovery snapshot only |

For authenticated users:

### Successful server fetch

Use mapped server subjects.

### Successful server fetch returning `[]`

This means the user genuinely has zero selected subjects.

Show the subject-selection gate.

Do **not** inject `DEFAULT_SUBJECTS`.

### Failed server fetch + genuine persisted legacy subject snapshot

Show that persisted snapshot as a recovery fallback with a clear sync-error warning.

Subject mutations are disabled while sync is unavailable.

Local bullets and past papers remain editable.

### Failed server fetch + no genuine persisted legacy snapshot

Show the synchronization error state.

Do **not** display Mathematics, Physics and IT simply because `loadData()` synthesized `DEFAULT_SUBJECTS`.

---

# 8. Critical Distinction: Genuine Legacy Subjects vs `DEFAULT_SUBJECTS`

The implementation must distinguish:

```text
subjects actually persisted by the user/app previously
```

from:

```text
DEFAULT_SUBJECTS synthesized because no subject data existed
```

A brand-new authenticated user must never appear to have selected Math, Physics and IT merely because the local fallback generated them.

When:

```typescript
saveData(state, { persistSubjects: false })
```

runs and no genuine persisted subject array exists, preserve:

```typescript
subjects: []
```

rather than persisting the in-memory `DEFAULT_SUBJECTS`.

Add tests for this behaviour.

---

# 9. Persistence Model

Add:

```typescript
saveData(
  state: AppState,
  options?: { persistSubjects?: boolean }
)
```

For authenticated/server-backed sessions:

```typescript
saveData(state, { persistSubjects: false })
```

must:

1. read existing persisted state;
2. preserve its genuine legacy `subjects` array;
3. persist the newest:
   - bullets
   - past papers
   - settings;
4. never overwrite the legacy subject snapshot with `resolvedSubjects`;
5. never begin persisting server subjects merely because the server query has completed.

Do **not** block the entire local save effect while server subject queries are loading.

Bullets, papers and settings must continue saving normally.

---

# 10. Catalogue-Driven Subject Selection

Standard subject selection must **not** use free-text subject-name input.

The user must choose official subjects from:

```text
public.catalogue_subjects
```

The selection UI must be:

- searchable
- selectable
- generic/data-driven
- canonical-name based
- aware of the 7-subject maximum
- duplicate-safe

Adding more catalogue rows later must not require frontend code changes.

Do not hard-code the visible selector to only Mathematics, Physics and Information Technology.

The current three catalogue rows are development data only.

A future checkpoint will populate the full Cambridge International AS & A Level subject catalogue.

## Custom subjects

Free-text subject creation is allowed only through a clearly separate:

```text
Add custom subject
```

workflow backed by `public.custom_subjects`.

Custom subject entry must not be the default path for official catalogue subjects.

---

# 11. Application Flow

Use:

```text
Authentication
    ↓
Onboarding / Welcome
    ↓
Subject Selection Gate (when zero active subjects)
    ↓
Main Application
```

Subject selection remains separate from `profiles.onboarding_status`.

Do not embed the catalogue selector into the existing onboarding modal.

When the authenticated user has zero active subjects, show a dedicated subject-selection experience instead of the normal empty dashboard.

---

# 12. Legacy Pre-Selection

When the server returns zero active subjects, the selection gate may pre-check catalogue items only when **actual local study data** demonstrates that subject was used.

Use:

- `state.bullets[].subjectId`
- `state.pastPapers[].subjectId`

Do not use:

- `state.subjects`
- `DEFAULT_SUBJECTS`
- theme overrides
- component metadata
- extraction changelogs
- chapter-planning metadata

Example:

```text
local bullet has subjectId = math
→ pre-check Mathematics
```

This is UI convenience only.

Do not automatically create server records until the user confirms selection.

---

# 13. Server → UI Mapping Layer

Recommended new file:

```text
src/lib/subjects/catalogueUiIds.ts
```

Responsibilities:

- legacy slug override map
- future slug passthrough
- deterministic fallback colors

Recommended new file:

```text
src/lib/subjects/mapUserSubjects.ts
```

Responsibilities:

- joined DB row → `Subject`
- name resolution
- stable UI ID generation
- metadata attachment
- sorting

Name precedence:

```text
display_name_override
→ catalogue subject name
→ custom subject name
```

---

# 14. Data Access Layer

Recommended:

```text
src/features/subjects/subjectsApi.ts
```

Functions should cover:

- active catalogue fetch
- active user-subject fetch
- archived/restorable subject lookup
- syllabus-version lookup
- catalogue user-subject creation
- custom-subject creation
- archive
- restore
- custom rollback cleanup

Do not directly write `user_subjects`.

Use approved RPCs.

---

# 15. Syllabus Version Is Optional

Catalogue membership and syllabus-content availability are separate concepts.

When creating a catalogue user subject:

1. attempt to resolve an active syllabus version;
2. if found, attach it;
3. if none exists, still allow subject selection with `syllabus_version_id = null`/omitted **if the existing RPC/schema permits it**.

Verify the exact `create_user_subject` signature before implementation.

Do not make every catalogue subject dependent on already-imported syllabus content.

This is required because the catalogue may be populated before every subject syllabus has been imported.

---

# 16. Archive / Restore Lifecycle

Normal subject removal means:

```text
ACTIVE
  ↓
ARCHIVED
```

Use:

```text
set_user_subject_archived(..., true, ...)
```

Do **not** expose `soft_delete_user_subject` as the normal Remove Subject action.

Restoring means:

```text
ARCHIVED
  ↓
ACTIVE
```

Use:

```text
set_user_subject_archived(..., false, ...)
```

Local study data remains untouched.

Permanent destructive deletion is outside this checkpoint.

---

# 17. Explicit Archived-Subject Lookup

The normal active query excludes archived rows.

Therefore the implementation must explicitly locate restorable archived rows before creating replacements.

For catalogue subjects:

```text
selection requested
    ↓
look for matching archived row
    ↓
found → restore existing row
not found → create new row
```

Use either:

- a dedicated archived query, or
- a specific restorable-subject lookup.

Do not create duplicate records simply because archived records are absent from the active query.

---

# 18. Custom Subject Creation Rollback

Custom subject creation is a multi-step operation:

```text
insert custom_subject
        ↓
create_user_subject RPC
```

If the first succeeds and the second fails:

1. verify the newly created custom definition is not selected;
2. perform best-effort cleanup using the approved custom-subject deletion mechanism;
3. log cleanup errors without hiding the original failure;
4. surface the original user-facing error.

This avoids orphan custom subject records after failures such as the seven-subject limit.

---

# 19. TanStack Query Design

Suggested keys:

```typescript
['subjects', 'catalogue']
['subjects', 'user', userId]
['subjects', 'user', userId, 'archived']
```

Catalogue query may use a longer stale time.

User-subject query must:

- be enabled only for an authenticated user;
- never use previous-user data as placeholder data;
- avoid `keepPreviousData` across users.

On logout/user change:

- remove user-specific subject queries;
- retain shared catalogue cache.

Prefer feature-level cache lifecycle over coupling QueryClient into `AuthProvider`.

---

# 20. Subject Mutation Behaviour

## Add catalogue subject

1. check whether a matching archived row exists;
2. restore it when found;
3. otherwise resolve active syllabus version if available;
4. call `create_user_subject`;
5. use `crypto.randomUUID()` for `client_operation_id`;
6. invalidate user-subject queries on success;
7. surface the maximum-seven error clearly.

## Add custom subject

1. insert custom definition;
2. create `user_subject`;
3. roll back the brand-new definition on partial failure where safe.

## Remove

Archive.

## Restore

Restore the existing archived row.

---

# 21. Error Fallback Behaviour

When user-subject loading fails:

| Capability | Behaviour |
|---|---|
| Subject list | Genuine persisted legacy snapshot if one exists |
| Error UI | Persistent sync warning + retry |
| Server subject mutations | Disabled |
| Bullet editing | Enabled |
| Past-paper editing | Enabled |
| Non-subject settings | Enabled |
| Local study data | Never erased |
| Navigation | Enabled for genuine fallback subjects |
| New user with no real legacy snapshot | Sync error only; do not inject defaults |

Recommended message:

```text
Unable to sync subjects — showing your local snapshot. Your study data is safe.
```

Only use that exact concept when a genuine local snapshot actually exists.

---

# 22. Derived Display State and Backups

Raw `useAppState().state.subjects` may remain a stale compatibility snapshot.

Current authenticated UI/export should instead use a derived state:

```typescript
const displayState: AppState = {
  ...state,
  subjects: resolvedSubjects,
};
```

Use `displayState` for:

- Settings display
- current subject counts
- subject management
- export/backup representing current active selection
- subject-aware UI components

Do **not** write `displayState.subjects` back into the preserved legacy subject snapshot during this checkpoint.

## Import limitation

Import can continue populating local compatibility state.

Do not auto-sync imported subjects to Supabase in this checkpoint.

Document that limitation.

---

# 23. `DEFAULT_SUBJECTS` Removal Is Out of Scope

Do not remove `DEFAULT_SUBJECTS` yet.

Known dependencies include:

- `src/lib/storage.ts`
- `getInitialState()`
- `loadData()` fallback
- import fallback
- `src/lib/storage/syllabusStorage.ts`
- default component seeding
- architecture documentation

Long term, Supabase subject selection will replace these defaults as the authoritative subject source.

This checkpoint should **decouple the application from the defaults before deleting them**.

---

# 24. Recommended Files to Create

```text
src/lib/subjects/catalogueUiIds.ts
src/lib/subjects/mapUserSubjects.ts
src/lib/subjects/legacySubjectUsage.ts

src/features/subjects/queryKeys.ts
src/features/subjects/subjectsApi.ts
src/features/subjects/useCatalogueSubjects.ts
src/features/subjects/useUserSubjects.ts
src/features/subjects/useSubjectMutations.ts
src/features/subjects/useResolvedSubjects.ts

src/components/subjects/SubjectSelectionGate.tsx
src/components/subjects/CatalogueSubjectPicker.tsx
src/components/subjects/CustomSubjectForm.tsx
src/components/subjects/SubjectsSyncErrorBanner.tsx
src/components/subjects/SubjectManageSection.tsx

src/lib/subjects/__tests__/catalogueUiIds.test.ts
src/lib/subjects/__tests__/mapUserSubjects.test.ts
src/lib/subjects/__tests__/legacySubjectUsage.test.ts

docs/architecture/SUBJECT_SELECTION.md
```

Exact file breakdown may be adjusted during implementation if a simpler structure preserves the approved architecture.

---

# 25. Recommended Files to Modify

```text
src/types/index.ts
src/lib/validation.ts
src/lib/storage.ts
src/hooks/useAppState.ts
src/pages/Index.tsx
src/components/settings/Settings.tsx
src/App.tsx (only if QueryClient defaults genuinely need adjustment)
```

Do not modify unrelated features.

---

# 26. Documentation Requirement

Create or update architecture documentation to explicitly state:

> Standard subjects are selected from the shared catalogue. Official catalogue subjects must not be created through free-text input. Custom subjects are a separate explicit workflow.

Also document:

- server authority
- legacy snapshot behaviour
- stable UI ID rules
- archive/restore model
- future catalogue expansion
- `DEFAULT_SUBJECTS` as transitional legacy behaviour

---

# 27. Tests to Add

## Catalogue UI ID tests

Verify:

```text
mathematics → math
physics → physics
information-technology → it
future slug → same slug
```

## Mapping tests

Verify:

- catalogue row maps correctly
- custom row maps to `custom-{fullUuid}`
- metadata UUIDs retained
- display-name override precedence
- sorting

## Legacy-usage tests

Verify:

- bullets trigger pre-selection
- past papers trigger pre-selection
- `DEFAULT_SUBJECTS` alone do not trigger pre-selection

## Persistence tests

Verify:

- authenticated saves update bullets/papers/settings
- genuine legacy subjects are preserved
- server-resolved subjects are not written over the legacy snapshot
- no genuine persisted subject snapshot results in preserved `[]`
- synthesized `DEFAULT_SUBJECTS` are not misclassified as real user selection

## Query/account isolation tests where practical

Verify:

- user-specific keys
- no previous-user placeholder subject data
- logout/user change clears user-specific subject state

---

# 28. Required Validation After Implementation

Run:

```powershell
npx.cmd tsc --noEmit
npm.cmd run build
npx.cmd supabase db lint
npx.cmd supabase test db
```

Also run the relevant frontend/Vitest test command used by the repository.

Do not reset the database merely to perform implementation unless genuinely required.

Do not delete Docker volumes.

---

# 29. Manual Verification Checklist

After automated checks pass, manually verify:

1. Existing `/math`, `/physics`, `/it` route behaviour remains stable when those subjects are selected.
2. Existing local bullets remain intact.
3. Existing local past papers remain intact.
4. Authenticated user with zero server subjects sees the subject-selection gate.
5. `DEFAULT_SUBJECTS` are not treated as user selections for a new account.
6. Searchable catalogue selection works.
7. Subject selection persists after refresh.
8. Subject selection persists across browsers.
9. Selected count reflects the 7-subject maximum.
10. An eighth active subject is rejected safely.
11. Archived subject can be restored.
12. Removing a subject archives rather than permanently deletes.
13. Re-adding an archived catalogue subject restores its existing row.
14. Sign-out does not expose the previous user's subjects.
15. A different account receives only its own subject selection.
16. Simulated subject-query failure does not erase local study data.
17. Genuine legacy fallback is clearly labelled.
18. New user without a real legacy snapshot does not see Math/Physics/IT as fallback subjects.
19. Backup/export represents current resolved server subjects rather than stale defaults.
20. Custom-subject creation failure does not leave avoidable orphan definitions.

---

# 30. Explicitly Out of Scope

Do not:

- migrate bullets to Supabase;
- migrate past papers to Supabase;
- migrate syllabus progress;
- migrate components;
- migrate notes;
- migrate deadlines;
- implement notifications;
- implement AI features;
- populate the full Cambridge catalogue yet;
- remove `DEFAULT_SUBJECTS`;
- connect hosted Supabase;
- push database changes to hosted Supabase;
- merge or push to `main`;
- change migrations/RLS/grants unless a confirmed defect is discovered.

---

# 31. Future Catalogue Direction

The subject-selection implementation must be generic enough to support:

```text
Exam Board
   ↓
Qualification
   ↓
Catalogue Subjects
```

The first production catalogue target is Cambridge International AS & A Level.

A separate future checkpoint will populate the full official Cambridge subject list.

Future boards/qualifications should be addable largely through catalogue data rather than rewriting subject-selection UI.

---

# 32. Resume Instructions for Cursor Agent

When resuming this work:

1. Confirm branch:

```powershell
git branch --show-current
git status
```

Expected branch:

```text
feat/supabase-database-foundation
```

2. Read this entire document before editing.

3. Inspect the current repository to confirm no relevant code changed since this handoff was committed.

4. Verify exact generated database types and RPC signatures before writing API calls.

5. Implement only the approved subject-selection checkpoint described here.

6. Do not alter migrations/RLS/grants unless a genuine schema defect is found.

7. Do not connect hosted Supabase.

8. Do not migrate study data.

9. Run all automated validation.

10. Return:
   - files created/modified;
   - implementation summary;
   - validation results;
   - deviations from this plan;
   - exact manual tests the user should perform.

11. **Do not commit or push until the user has reviewed the validation results and manual tests.**

---

## Implementation Authorization

This document represents the approved architecture for the subject-selection checkpoint.

Cursor may proceed with implementation when explicitly instructed by the user, subject to the constraints above.
