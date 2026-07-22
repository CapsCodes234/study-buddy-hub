# Study Buddy Hub — Stage 3 RLS Policy Matrix Draft 3 Reviewed

**Document status:** Reviewed design aligned with SQL Draft 3; local Supabase validation still required  
**Parent schema:** `STUDY_BUDDY_HUB_STAGE_3_DATABASE_SCHEMA_DRAFT_3_REVIEWED.md`  
**SQL companion:** `STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql`  
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
| `custom_subjects` | Own | Own | No; version-aware function to be used | `soft_delete_custom_subject()` after its selected subject is removed |
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
| `custom_syllabus_nodes` | Own | Own | `update_custom_syllabus_node_if_version()` | `soft_delete_custom_syllabus_node()`; deletes its private subtree |
| `user_syllabus_progress` | Own | `set_syllabus_progress()` | `set_syllabus_progress()` | `soft_delete_syllabus_progress()` |
| `syllabus_notes` | Own | `set_syllabus_note()` | `set_syllabus_note()` | `soft_delete_syllabus_note()` |
| `custom_components` | Own | Own | `update_custom_component_if_version()` | `soft_delete_custom_component()` |
| `paper_attempts` | Own | Own with idempotency key | `update_paper_attempt_if_version()` | `soft_delete_paper_attempt()` |

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


### Idempotent create retries

`create_user_subject()`, `set_syllabus_progress()` and `set_syllabus_note()` return the existing row when the same `client_operation_id` is retried.

For the remaining direct-insert tables with `client_operation_id`, the repository layer must:

1. treat SQLSTATE `23505` on the operation-ID unique index as a retry result rather than a user-facing failure;
2. re-fetch the row by `user_id` and `client_operation_id`;
3. return that row to the caller;
4. test this behaviour offline and after reconnection.

A later protected create RPC may replace this repository behaviour if local testing shows that a server-side function provides clearer reliability.


---

## 6. Reflections and Planning

| Table | SELECT | Direct INSERT | Direct UPDATE | Direct DELETE |
|---|---|---|---|---|
| `weekly_reflections` | Own | Own | `update_weekly_reflection_if_version()` | `soft_delete_weekly_reflection()` |
| `chapter_deadlines` | Own | Own | `update_chapter_deadline_if_version()` | `soft_delete_chapter_deadline()` |
| `calendar_events` | Own | Own | `update_calendar_event_if_version()` | `soft_delete_calendar_event()` |

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
| `document_uploads` | Read own metadata | Backend registration/status; protected Edge Function for object + metadata deletion |
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


### Document deletion workflow

Document deletion is not a SQL-only RPC because the underlying Storage object must be removed through the Storage API.

A protected Edge Function named conceptually `delete-document-upload` must:

1. authenticate the caller;
2. verify ownership through `document_uploads.user_id`;
3. remove the object from the private bucket through the Storage API;
4. only after successful or already-completed removal, mark the metadata row as deleted;
5. be idempotent so a retry returns the completed result;
6. record a safe failure state when object removal fails.

Current Supabase Storage documentation identifies `owner_id` as the supported ownership field and treats `owner` as deprecated. The local generated Storage schema must still be checked during the first clean local reset.


---

## 10. Protected Function Matrix

| Function | Security mode | Client role | Purpose |
|---|---|---|---|
| `create_user_subject` | Definer | Authenticated | Idempotent subject creation |
| `set_user_subject_archived` | Definer | Authenticated | Version-aware archive/unarchive |
| `soft_delete_user_subject` | Definer | Authenticated | Version-aware subject tombstone and child handling |
| `soft_delete_custom_subject` | Definer | Authenticated | CAS tombstone for an unselected custom-subject definition |
| `soft_delete_custom_syllabus_node` | Definer | Authenticated | CAS subtree tombstone plus related progress/note/deadline handling |
| `soft_delete_syllabus_progress` | Definer | Authenticated | CAS progress tombstone |
| `soft_delete_syllabus_note` | Definer | Authenticated | CAS note tombstone |
| `soft_delete_custom_component` | Definer | Authenticated | CAS component tombstone; preserve paper history |
| `soft_delete_paper_attempt` | Definer | Authenticated | CAS paper-attempt tombstone |
| `soft_delete_weekly_reflection` | Definer | Authenticated | CAS reflection tombstone |
| `soft_delete_chapter_deadline` | Definer | Authenticated | CAS deadline tombstone |
| `soft_delete_calendar_event` | Definer | Authenticated | CAS internal-event tombstone |
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
- soft-deleted rows remain tombstones until approved cleanup;
- every user-facing deletable record can be tombstoned through its protected function;
- stale delete base versions return a conflict;
- deleting a custom syllabus parent tombstones the complete private subtree;
- deleting a custom component preserves historical paper attempts and their snapshots.

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
- Storage deletion uses the protected backend API workflow;
- repeated document-deletion requests are idempotent;
- direct Storage metadata deletion remains unavailable.

---

## 12. Status

This matrix is aligned with SQL Draft 3. It is suitable for independent review and local test implementation, but it is not considered production-validated until the complete migration chain and RLS tests pass on a clean local Supabase stack.
