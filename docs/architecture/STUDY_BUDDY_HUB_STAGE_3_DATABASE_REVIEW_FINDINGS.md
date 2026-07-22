# Study Buddy Hub — Stage 3 Database Technical Review Findings

**Document status:** Accepted independent review input with architecture-owner refinements  
**Review source:** Independent Claude review of the Stage 3 database schema, SQL Draft 1 and RLS Matrix Draft 1  
**Purpose:** Record confirmed issues and required corrections before executable Supabase migrations are created  
**Important limitation:** The reviewer analysed supplied document content and did not execute the SQL against a live or local Supabase database.

---

## 1. Review Verdict

### Repository-document verdict

The following documents are appropriate to keep under `docs/architecture/` as review artefacts:

- `STUDY_BUDDY_HUB_STAGE_3_DATABASE_SCHEMA_DRAFT_2_APPROVED.md`;
- `STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_1.sql`;
- `STUDY_BUDDY_HUB_STAGE_3_RLS_POLICY_MATRIX_DRAFT_1.md`.

The conceptual database direction is approved. The SQL and RLS documents were not migration-ready and required revision.

### Technical verdict

**Requires revision before migration.**

The relational design is fundamentally sound, especially its:

- separation of shared catalogue and private data;
- separate official and custom component tables;
- composite ownership pattern;
- version fields;
- soft-deletion direction;
- paper-attempt snapshots;
- backend-only operational schema.

However, SQL Draft 1 contained execution and security gaps that had to be corrected before local Supabase validation.

---

## 2. Accepted Findings

### DBR-001 — Composite `ON DELETE SET NULL` ownership bug

- **Severity:** Critical
- **Confidence:** High
- **Affected objects:** `calendar_events_subject_owner_fk`, `ai_extraction_jobs_subject_owner_fk`
- **Issue:** Composite foreign keys containing both `user_subject_id` and non-null `user_id` used `ON DELETE SET NULL`. Deleting the parent could attempt to null both values and violate the non-null ownership column.
- **Correction:** Detach only `user_subject_id`, preserve `user_id`, and validate the optional subject belongs to the same owner.
- **Migration blocker:** Yes.

### DBR-002 — Incomplete executable RLS policies

- **Severity:** Critical
- **Confidence:** High
- **Affected objects:** Most client-facing tables
- **Issue:** RLS was enabled broadly, but the matrix contained several policy templates and intentions rather than a complete executable policy set.
- **Why it matters:** This fails closed rather than leaking records, but most application workflows would be inaccessible.
- **Correction:** Provide explicit shared-catalogue policies, owner policies and read-only policies for controlled-generation records.
- **Migration blocker:** Yes.

### DBR-003 — Seven-subject rule could be bypassed

- **Severity:** Critical
- **Confidence:** High
- **Affected object:** `user_subjects`
- **Issue:** SQL Draft 1 enforced the limit in `create_user_subject()` while also allowing direct authenticated inserts. Direct inserts could bypass the RPC.
- **Additional owner refinement:** The check must also cover restoring or unarchiving a subject, not only inserting one.
- **Correction:** Enforce the active-subject rule in a database trigger for insert and relevant updates, serialize checks per user, and keep ordinary creation behind a protected RPC.
- **Migration blocker:** Yes.

### DBR-004 — Version increment was not compare-and-swap

- **Severity:** High
- **Confidence:** High
- **Affected objects:** Offline-supported mutable records
- **Issue:** Incrementing `version` does not reject a stale update. No base-version comparison was enforced.
- **Correction:** Route versioned mutations through protected functions that update only when the stored version equals the supplied base version. Return a conflict when no matching row is updated.
- **Migration blocker:** It blocks activation of offline conflict-safe writes and any claim of stale-write protection. It does not prevent creating unrelated foundational catalogue tables locally.

### DBR-005 — Excessive client grants

- **Severity:** High
- **Confidence:** High
- **Affected objects:** `document_uploads`, `import_runs`, `profiles`, and versioned study records
- **Issue:** Broad table-level mutation grants did not match the narrower intended workflows.
- **Correction:** Use read-only client access for protected workflow tables, column-level account preference updates, and protected functions for sensitive or version-aware changes.
- **Migration blocker:** Yes for affected feature migrations.

### DBR-006 — Signup profile trigger risk

- **Severity:** High
- **Confidence:** High
- **Affected object:** `handle_new_user()`
- **Issue:** Accepting a final username from signup metadata could cause a unique conflict and abort signup.
- **Correction:** Create the profile without a claimed username, then require username selection through a protected, case-normalising, reserved-name-aware function.
- **Migration blocker:** Yes for authentication rollout.

### DBR-007 — Missing narrow protected functions

- **Severity:** High
- **Confidence:** High
- **Affected workflows:** Username changes, notification read state, milestone acknowledgement, AI cancellation/review, push-device registration, subject lifecycle and conflict-safe writes
- **Issue:** The RLS document described narrow RPCs but SQL Draft 1 did not implement them.
- **Correction:** Add reviewed protected functions with fixed search paths, caller validation and restricted execution grants.
- **Migration blocker:** Yes for the related workflows.

### DBR-008 — Storage policies were missing

- **Severity:** High
- **Confidence:** High
- **Affected object:** `storage.objects`
- **Issue:** The database documented a private upload bucket but did not include user-scoped upload/read policies.
- **Correction:** Add policies for the private `syllabus-uploads` bucket using a user-ID path prefix and object ownership. Keep deletion backend-mediated through the Storage API.
- **Migration blocker:** Yes for document upload and AI extraction.

---

## 3. Additional Architecture-Owner Corrections

### DBR-009 — Shared syllabus parent/version integrity

A shared syllabus node must not use a parent from a different syllabus version.

**Correction:** Use a composite self-reference based on `(parent_id, syllabus_version_id)` and add cycle prevention.

### DBR-010 — Custom syllabus cycle protection

The custom syllabus hierarchy must reject self-parenting and ancestor cycles.

**Correction:** Add recursive cycle-validation triggers.

### DBR-011 — Backend child ownership integrity

The following relationships must enforce matching `user_id` at database level:

- document upload → AI job;
- AI job → extraction result;
- AI job → AI usage ledger;
- notification → delivery attempt;
- integration → external calendar link;
- internal calendar event → external calendar link.

**Correction:** Add matching composite ownership foreign keys or equivalent validated relationships.

### DBR-012 — Idempotent offline create operations

Version checks protect updates but do not by themselves prevent duplicate create operations after retries.

**Correction:** Add optional `client_operation_id` values with per-user unique indexes on offline-created records.

### DBR-013 — Soft-deletion workflow

A subject soft deletion must not leave active child records appearing independently.

**Correction:** Use a controlled subject-deletion function that creates tombstones for child study data and detaches durable internal calendar history rather than hard deleting it.

### DBR-014 — Storage metadata must not be deleted directly

Deleting `storage.objects` metadata directly can leave the underlying object in Storage.

**Correction:** Perform deletion through the Storage API from a trusted backend and then update application metadata.

---

## 4. Findings Considered Sound in Draft 1

The review accepted these architectural elements:

- the overall dependency order of table creation;
- the separate `private` schema;
- the composite ownership pattern where matching unique constraints existed;
- shared/custom component separation;
- generated paper-attempt percentage;
- current-year paper validation through a trigger rather than a time-dependent check constraint;
- advisory locking for concurrent subject-limit checks;
- the use of `(select auth.uid())` in RLS conditions;
- denial of client mutations for generated activity, milestone, AI and notification records;
- keeping the current SQL outside `supabase/migrations/` until reviewed and tested.

---

## 5. Corrections Incorporated into Reviewed Draft 2

SQL Draft 2 and RLS Matrix Draft 2 incorporate:

- safe optional subject detachment;
- complete shared-catalogue and owner RLS policies;
- seven-subject enforcement for inserts, restores and unarchives;
- restricted table grants;
- nullable pre-onboarding usernames;
- protected username claiming;
- case-insensitive uniqueness and reserved-name checks;
- core compare-and-swap mutation functions;
- client operation IDs for idempotent creation;
- subject soft-deletion workflow;
- hierarchy cycle prevention;
- stronger backend ownership foreign keys;
- private Storage upload/read policies;
- narrow notification, milestone, AI and push-device functions;
- explicit separation between SQL review readiness and local migration validation.

---

## 6. Remaining Validation Work

Even after these corrections, the following cannot be honestly marked complete until execution in a local Supabase stack:

1. PostgreSQL syntax and extension verification;
2. migration dependency verification after the monolithic draft is split;
3. Auth-trigger integration tests;
4. all owner/non-owner/anonymous RLS tests;
5. concurrent seven-subject tests;
6. stale-version conflict tests;
7. Storage upload and read tests;
8. generated TypeScript type verification;
9. Supabase database-advisor review;
10. clean `supabase db reset` from an empty local database.

---

## 7. Final Status

| Artefact | Status |
|---|---|
| Conceptual schema direction | Approved |
| SQL Draft 1 | Superseded by reviewed Draft 2 |
| RLS Matrix Draft 1 | Superseded by reviewed Draft 2 |
| SQL Draft 2 | Ready for independent review and local validation, not production |
| RLS Matrix Draft 2 | Ready for independent review and local validation, not production |
| Executable Supabase migrations | Not created yet |
| Remote Supabase deployment | Not authorised yet |

---

## 8. Required Next Sequence

1. Commit this findings document and both reviewed Draft 2 files.
2. Run a second independent read-only review.
3. Initialise a local Supabase development environment.
4. Split SQL Draft 2 into ordered migrations.
5. create the database/RLS test suite;
6. run `supabase db reset` until the migration chain passes cleanly;
7. generate TypeScript database types;
8. connect only a development or test Supabase project;
9. use a dry run before pushing remote migrations;
10. connect the application only after database security tests pass.
