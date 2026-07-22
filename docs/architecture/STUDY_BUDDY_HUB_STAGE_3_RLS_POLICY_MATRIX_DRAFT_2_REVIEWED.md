# Study Buddy Hub — Stage 3 RLS Policy Matrix Draft 2 Reviewed

**Document status:** Reviewed design aligned with SQL Draft 2; local Supabase validation still required  
**Parent schema:** `STUDY_BUDDY_HUB_STAGE_3_DATABASE_SCHEMA_DRAFT_2_APPROVED.md`  
**SQL companion:** `STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_2_REVIEWED.sql`  
**Default posture:** Deny unless an explicit table privilege and RLS policy allow access

---

## 1. Security Model

- `anon` receives no Study Buddy Hub application-table access in Web v1.
- `authenticated` may read approved shared catalogue data.
- `authenticated` may read only its own private rows.
- Ordinary direct mutations are deliberately limited.
- Versioned study updates use protected compare-and-swap functions.
- Controlled-generation records are read-only to the client.
- Backend operational records remain in an unexposed `private` schema.
- Storage objects use a private bucket and user-scoped paths.
- `service_role` remains server-side and is never included in the browser.

---

## 2. Shared Catalogue Access

The shared catalogue may store unlimited subjects and syllabus records. The seven-active-subject rule applies only to one user's active `user_subjects` rows.

| Table | Authenticated SELECT | Client mutation |
|---|---|---|
| `exam_boards` | Active records | None |
| `qualifications` | Active records with active board | None |
| `catalogue_subjects` | Active records with active qualification/board | None |
| `syllabuses` | Active records with active subject | None |
| `syllabus_versions` | Active or retired approved versions | None |
| `syllabus_nodes` | Active nodes in readable versions | None |
| `syllabus_components` | Active components in readable versions | None |

Draft syllabus versions are not client-readable.

---

## 3. Account and Preference Tables

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Own | Signup trigger | Own permitted columns only | Account deletion backend |
| `user_preferences` | Own | Signup trigger | Own permitted columns only | Account cascade |
| `notification_preferences` | Own | Signup trigger | Own permitted columns only | Account cascade |

### Protected username workflow

`profiles.username` is nullable until onboarding completes. A user claims or changes it only through `change_username()`.

The function:

- derives the caller from `auth.uid()`;
- normalises to lowercase;
- checks length and format;
- rejects reserved names;
- relies on a case-insensitive unique index;
- returns a generic unavailable response on collision.

No client policy permits direct username mutation.

---

## 4. Subject Tables

| Table | SELECT | Direct INSERT | Direct UPDATE | Direct DELETE |
|---|---|---|---|---|
| `custom_subjects` | Own | Own | No; version-aware function to be used | No; soft-delete workflow |
| `user_subjects` | Own | No; `create_user_subject()` | No; protected archive/settings functions | No; `soft_delete_user_subject()` |

### Seven-subject enforcement

The limit is enforced through a database trigger whenever a row becomes active through:

- insert;
- unarchive;
- restoration from soft deletion;
- ownership change by a trusted migration.

The check uses a per-user transaction advisory lock to prevent concurrent seventh/eighth subject races.

---

## 5. Syllabus, Progress, Notes, Components and Papers

| Table | SELECT | Direct INSERT | Direct UPDATE | Direct DELETE |
|---|---|---|---|---|
| `custom_syllabus_nodes` | Own | Own | Protected version-aware function | Soft-delete function |
| `user_syllabus_progress` | Own | `set_syllabus_progress()` | `set_syllabus_progress()` | Protected tombstone workflow |
| `syllabus_notes` | Own | `set_syllabus_note()` | `set_syllabus_note()` | Protected tombstone workflow |
| `custom_components` | Own | Own | Protected version-aware function | Soft-delete function |
| `paper_attempts` | Own | Own with idempotency key | `update_paper_attempt_if_version()` | Soft-delete function |

### Ownership protection

RLS checks `auth.uid() = user_id`. Composite ownership foreign keys and validation triggers additionally prevent cross-user parent references.

### Conflict protection

Version-aware functions:

- require the caller to own the row;
- accept a `base_version`;
- update only when the current version matches;
- return SQLSTATE `40001` for a conflict;
- allow idempotent create retries through `client_operation_id`.

Direct UPDATE grants are intentionally absent for versioned study data.

---

## 6. Reflections and Planning

| Table | SELECT | Direct INSERT | Direct UPDATE | Direct DELETE |
|---|---|---|---|---|
| `weekly_reflections` | Own | Own | Protected version-aware function | Soft delete |
| `chapter_deadlines` | Own | Own | Protected version-aware function | Soft delete |
| `calendar_events` | Own | Own | Protected version-aware function | Soft delete |

When a subject is soft-deleted, internal calendar history is detached from the subject rather than destroyed.

---

## 7. Controlled-Generation Records

| Table | Client access | Mutation path |
|---|---|---|
| `activity_events` | Read own | Trusted backend/database logic only |
| `user_milestones` | Read own | Backend creation; `acknowledge_milestone()` for acknowledgement |
| `ai_extraction_jobs` | Read own | Edge Function/backend; `cancel_ai_job()` for eligible cancellation |
| `ai_extraction_results` | Read own | Backend creation; `review_ai_result()` for decision |
| `notifications` | Read own | Backend creation; `mark_notification_read()` for acknowledgement |
| `document_uploads` | Read own metadata | Backend registration/status/deletion |
| `import_runs` | Read own status | Protected import workflow |

No ordinary client grant allows fabrication of achievements, AI results, job provider fields or notifications.

---

## 8. Private Operational Schema

The following are not exposed through the Data API and have no authenticated client grants:

- `private.reserved_usernames`;
- `private.ai_usage_ledger`;
- `private.notification_deliveries`;
- `private.push_devices`;
- `private.external_integrations`;
- `private.external_calendar_links`.

Protected functions may operate on these tables after validating `auth.uid()`.

---

## 9. Storage Policies

### Bucket

- ID: `syllabus-uploads`
- Access model: private
- Path: `<user_id>/<upload_id>/<sanitised_filename>`
- MIME type: PDF only
- File-size limit: configured in `supabase/config.toml` or Storage bucket settings

### `storage.objects` policies

| Operation | Rule |
|---|---|
| INSERT | Authenticated user, correct bucket, first path segment equals caller UID |
| SELECT | Correct bucket, caller owns object and path UID matches caller |
| UPDATE | Not granted for Web v1 |
| DELETE | Backend-mediated through Storage API |

Application code must never delete Storage metadata directly because the underlying object must be removed through the Storage API.

---

## 10. Protected Function Matrix

| Function | Security mode | Client role | Purpose |
|---|---|---|---|
| `create_user_subject` | Definer | Authenticated | Idempotent subject creation |
| `set_user_subject_archived` | Definer | Authenticated | Version-aware archive/unarchive |
| `soft_delete_user_subject` | Definer | Authenticated | Version-aware subject tombstone and child handling |
| `change_username` | Definer | Authenticated | Protected username claim/change |
| `set_syllabus_progress` | Definer | Authenticated | Idempotent create + CAS update |
| `set_syllabus_note` | Definer | Authenticated | Idempotent create + CAS update |
| `update_paper_attempt_if_version` | Definer | Authenticated | CAS paper update |
| `update_custom_subject_if_version` | Definer | Authenticated | CAS custom-subject update |
| `update_custom_syllabus_node_if_version` | Definer | Authenticated | CAS custom-node update |
| `update_custom_component_if_version` | Definer | Authenticated | CAS component update |
| `update_weekly_reflection_if_version` | Definer | Authenticated | CAS reflection update |
| `update_chapter_deadline_if_version` | Definer | Authenticated | CAS deadline update |
| `update_calendar_event_if_version` | Definer | Authenticated | CAS internal-event update |
| `mark_notification_read` | Definer | Authenticated | Narrow notification update |
| `acknowledge_milestone` | Definer | Authenticated | Narrow milestone update |
| `cancel_ai_job` | Definer | Authenticated | Eligible own-job cancellation |
| `review_ai_result` | Definer | Authenticated | Own-result review decision |
| `register_push_device` | Definer | Authenticated | Store private FCM token |
| `revoke_push_device` | Definer | Authenticated | Revoke own device token |

Every definer function uses an empty fixed `search_path`, fully qualified objects, caller validation and explicit execution grants.

---

## 11. Tests Required Before Migration Approval

### Shared catalogue

- authenticated user reads active catalogue;
- draft version is hidden;
- inactive parent hides child records;
- authenticated user cannot mutate catalogue;
- catalogue record count is not limited to seven.

### Owner isolation

For each private table:

- owner SELECT succeeds;
- non-owner SELECT returns no rows;
- anonymous access fails;
- cross-user FK insertion fails;
- user cannot transfer ownership during mutation.

### Subject limit

- first seven active subjects succeed;
- eighth fails;
- concurrent seventh/eighth results in only one success;
- unarchiving beyond seven fails;
- restoring beyond seven fails;
- unlimited shared catalogue seed succeeds.

### Conflict and idempotency

- correct base version updates and increments once;
- stale base version returns conflict;
- duplicate create operation ID returns the original row;
- no-op direct update is unavailable;
- soft-deleted rows remain tombstones until approved cleanup.

### Auth and username

- signup creates profile without final username;
- case-insensitive collision is rejected;
- reserved name is rejected;
- social signup succeeds without username metadata;
- final username can be claimed only through the protected function.

### AI, Storage and notifications

- upload outside user path fails;
- user cannot read another user's object;
- user cannot update AI provider/model/status;
- user cannot create notification or milestone;
- private operational tables are inaccessible;
- Storage deletion uses backend API workflow.

---

## 12. Status

This matrix is aligned with SQL Draft 2. It is suitable for independent review and local test implementation, but it is not considered production-validated until the complete migration chain and RLS tests pass on a clean local Supabase stack.
