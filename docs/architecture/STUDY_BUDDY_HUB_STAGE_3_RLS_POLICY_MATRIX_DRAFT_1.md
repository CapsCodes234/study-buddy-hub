# Study Buddy Hub — Stage 3 RLS Policy Matrix

**Document status:** Draft 1 — awaiting technical review  
**Parent schema:** `STUDY_BUDDY_HUB_STAGE_3_DATABASE_SCHEMA_DRAFT_2_APPROVED.md`  
**SQL companion:** `STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_1.sql`  
**Target:** Supabase PostgreSQL Row Level Security  
**Default posture:** Deny unless an explicit policy and table privilege allow access

---

## 1. Security Principles

1. All client-facing private tables have RLS enabled.
2. Anonymous users receive no application-table access in Web v1.
3. Authenticated users access only their own private rows.
4. Shared catalogue data is readable by authenticated users but not writable by ordinary users.
5. Backend-only operational tables remain in an unexposed `private` schema.
6. Sensitive writes use trusted database functions or Edge Functions.
7. RLS uses `(select auth.uid())` for user identity checks.
8. Authorization decisions do not rely on editable `raw_user_meta_data`.
9. `SECURITY DEFINER` is used only when necessary, with an empty fixed `search_path` and fully qualified objects.
10. Service-role credentials never enter the browser.

Supabase recommends RLS for tables exposed through its Data API, and its Auth schema should be represented to clients through protected application tables such as `profiles`, not queried directly from the browser. citeturn624492search2turn624492search3

---

## 2. Role Model

| Role | Intended access |
|---|---|
| `anon` | No Study Buddy Hub application data in Web v1 |
| `authenticated` | Shared catalogue reads and owner-scoped private data |
| `service_role` | Trusted server operations; never exposed to the client |
| migration/owner role | Version-controlled schema and policy administration |

The `private` schema must not be added to the Supabase Data API exposed-schema list. Custom schemas are exposed only when explicitly configured and granted, so this schema remains backend-only. citeturn624492search0turn624492search23

---

## 3. Standard Owner Policy Templates

### 3.1 Owner read

```sql
create policy "<table>_select_own"
on public.<table>
for select
to authenticated
using ((select auth.uid()) = user_id);
```

### 3.2 Owner insert

```sql
create policy "<table>_insert_own"
on public.<table>
for insert
to authenticated
with check ((select auth.uid()) = user_id);
```

### 3.3 Owner update

```sql
create policy "<table>_update_own"
on public.<table>
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

### 3.4 Owner delete

```sql
create policy "<table>_delete_own"
on public.<table>
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

The separate `USING` and `WITH CHECK` conditions protect both the existing row and the row after mutation. citeturn624492search3

---

## 4. Shared Catalogue Policies

These records are system-managed and unlimited by the per-user seven-subject rule.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `exam_boards` | Authenticated: active rows | Backend only | Backend only | Backend only |
| `qualifications` | Authenticated: active rows | Backend only | Backend only | Backend only |
| `catalogue_subjects` | Authenticated: active rows | Backend only | Backend only | Backend only |
| `syllabuses` | Authenticated: active rows | Backend only | Backend only | Backend only |
| `syllabus_versions` | Authenticated: active/retired approved rows | Backend only | Backend only | Backend only |
| `syllabus_nodes` | Authenticated when parent version is readable | Backend only | Backend only | Backend only |
| `syllabus_components` | Authenticated when parent version is readable | Backend only | Backend only | Backend only |

### Example active catalogue policy

```sql
create policy "catalogue_subjects_select_active"
on public.catalogue_subjects
for select
to authenticated
using (is_active = true);
```

For nodes and components, the policy should verify the parent syllabus version is approved/readable.

---

## 5. Table-by-Table RLS Matrix

### 5.1 Identity and preferences

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `profiles` | Own | Profile trigger/backend | Own, with username restrictions | Account deletion flow | Username changes may require protected RPC |
| `user_preferences` | Own | Signup trigger/backend | Own | Account cascade | — |
| `notification_preferences` | Own | Signup trigger/backend | Own | Account cascade | Security emails are not disabled here |

### 5.2 Subjects

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `custom_subjects` | Own | Own | Own | Soft delete own | Child ownership reinforced by FKs |
| `user_subjects` | Own | Prefer `create_user_subject()` RPC | Own | Soft delete/archive own | Seven active subjects enforced atomically |

Direct `user_subjects` insert may remain granted for migration/backend only. For ordinary UI creation, the RPC is the approved path.

### 5.3 Syllabus and progress

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `custom_syllabus_nodes` | Own | Own or import function | Own | Soft delete own | Uploaded/AI content remains private |
| `user_syllabus_progress` | Own | Own | Own | Soft delete own | Shared target validated against selected version |
| `syllabus_notes` | Own | Own | Own | Soft delete own | Note target validated |

### 5.4 Components and papers

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `custom_components` | Own | Own | Own | Soft delete own | Separate from shared components |
| `paper_attempts` | Own | Own | Own | Soft delete own | Component and subject relationship validated |

### 5.5 Reflection and planning

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `weekly_reflections` | Own | Own | Own | Soft delete own | One active reflection per week |
| `chapter_deadlines` | Own | Own | Own | Soft delete own | Target validation |
| `calendar_events` | Own | Own | Own | Soft delete own | External sync does not own internal event |

### 5.6 Controlled-generation tables

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `activity_events` | Own | Trusted functions only | None | None/retention backend | Prevent fabricated streak activity |
| `user_milestones` | Own | Trusted functions only | Protected acknowledgement only | Backend/account deletion | Prevent fabricated achievements |
| `ai_extraction_jobs` | Own | Protected Edge Function | Backend state machine | User cancel via RPC/backend | Provider/model fields server-only |
| `ai_extraction_results` | Own | Protected backend | Review via protected RPC | Backend cleanup | User cannot replace validated JSON |
| `notifications` | Own | Trusted backend only | Mark read via protected RPC or narrow policy | Backend/expiry | Prevent arbitrary notifications |

### 5.7 Import and documents

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `document_uploads` | Own metadata | Protected upload registration | Backend status only | Protected delete | Storage object also needs Storage RLS |
| `import_runs` | Own | Own preview or protected import service | Controlled status transitions | Cancel/cleanup | Import commit is transactional |

### 5.8 Private operational schema

| Table | Client access | Backend access |
|---|---|---|
| `private.ai_usage_ledger` | None | Edge Functions/service role |
| `private.notification_deliveries` | None | Notification dispatcher |
| `private.push_devices` | None | Token registration/revocation functions |
| `private.external_integrations` | None | OAuth callback/backend |
| `private.external_calendar_links` | None | Calendar sync backend |

---

## 6. Proposed Policy SQL

### 6.1 Profiles

```sql
create policy "profiles_select_own"
on public.profiles
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "profiles_update_own"
on public.profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

Direct profile insert is not granted because the signup trigger creates the row.

Username mutation should eventually move behind a protected `change_username()` RPC that:

- normalises;
- validates reserved names;
- rate-limits changes;
- records the change;
- returns a generic conflict message.

### 6.2 Standard owner tables

Apply all four owner policies to:

- `custom_subjects`;
- `custom_syllabus_nodes`;
- `user_syllabus_progress`;
- `syllabus_notes`;
- `custom_components`;
- `paper_attempts`;
- `weekly_reflections`;
- `chapter_deadlines`;
- `calendar_events`;
- `import_runs`.

Example for `paper_attempts`:

```sql
create policy "paper_attempts_select_own"
on public.paper_attempts
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "paper_attempts_insert_own"
on public.paper_attempts
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "paper_attempts_update_own"
on public.paper_attempts
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "paper_attempts_delete_own"
on public.paper_attempts
for delete to authenticated
using ((select auth.uid()) = user_id);
```

### 6.3 User subjects

```sql
create policy "user_subjects_select_own"
on public.user_subjects
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "user_subjects_insert_own"
on public.user_subjects
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "user_subjects_update_own"
on public.user_subjects
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_subjects_delete_own"
on public.user_subjects
for delete to authenticated
using ((select auth.uid()) = user_id);
```

The ordinary UI must use `create_user_subject()` so the seven-active-subject limit is checked atomically. Direct insert permission can be removed later if all migration/import flows use protected functions.

### 6.4 User preferences

```sql
create policy "user_preferences_select_own"
on public.user_preferences
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "user_preferences_update_own"
on public.user_preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

### 6.5 Controlled read-only client tables

```sql
create policy "activity_events_select_own"
on public.activity_events
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "user_milestones_select_own"
on public.user_milestones
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "ai_jobs_select_own"
on public.ai_extraction_jobs
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "ai_results_select_own"
on public.ai_extraction_results
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "notifications_select_own"
on public.notifications
for select to authenticated
using ((select auth.uid()) = user_id);
```

No ordinary client insert policy is created for these tables.

---

## 7. Narrow Update Operations

Broad update grants are inappropriate for tables where the user may alter only one field.

Recommended protected functions:

| Function | Permitted change |
|---|---|
| `acknowledge_milestone(milestone_id)` | Sets own `acknowledged_at` |
| `mark_notification_read(notification_id)` | Sets own `read_at` |
| `review_ai_result(job_id, decision, edited_payload)` | Approves/rejects through validated transaction |
| `cancel_ai_job(job_id)` | Cancels only eligible own jobs |
| `delete_document_upload(upload_id)` | Removes own object and metadata safely |
| `change_username(new_username)` | Controlled username validation/change |
| `register_push_device(token, metadata)` | Stores token in private schema |
| `revoke_push_device(device_id)` | Revokes own registered device |

Where `SECURITY DEFINER` is necessary, Supabase recommends setting a safe `search_path`, fully qualifying referenced objects and restricting function execution privileges. citeturn624492search1turn624492search6

---

## 8. Storage RLS Requirements

The private document bucket requires policies on `storage.objects`.

Proposed object path:

```text
syllabus-uploads/<user_id>/<upload_id>/<sanitised_filename>
```

Required rules:

- authenticated user uploads only within their own first path segment;
- user can read only own objects;
- user can delete only own objects;
- backend processor can read authorised objects;
- bucket remains private;
- failed and expired objects are cleaned by trusted backend logic.

Supabase Storage uploads may require both `INSERT` and matching `SELECT` access because the API can return inserted metadata. citeturn624492search17

---

## 9. Tests Required Per Owner Table

For every private table:

1. owner can select;
2. owner can insert where allowed;
3. owner can update where allowed;
4. owner can delete or soft-delete where allowed;
5. different authenticated user cannot select;
6. different authenticated user cannot mutate;
7. unauthenticated request cannot access;
8. changing `user_id` during update is denied;
9. cross-user parent reference is rejected by FK/trigger;
10. service operation succeeds only through approved backend path.

---

## 10. Special Security Tests

### Username and profiles

- case-insensitive duplicate username rejected;
- reserved username rejected by protected function;
- login resolver does not reveal username-to-email mapping;
- generic authentication errors;
- signup-trigger failure is observable and tested.

Supabase warns that signup triggers can block signups when they fail, so this path requires focused integration tests. citeturn624492search2

### Shared catalogue

- authenticated user reads active records;
- ordinary user cannot insert/update/delete;
- inactive/draft visibility follows approved policy;
- seven-subject rule does not affect catalogue record count.

### Components

- shared component cannot be changed by user;
- custom component accessible only to owner;
- paper attempt cannot reference another user's custom component;
- paper attempt cannot reference a shared component from an unrelated syllabus version.

### Offline conflict mutations

- stale base version rejected atomically;
- correct base version increments version;
- user cannot alter another user's versioned record;
- soft-deleted rows do not reappear unintentionally.

### AI

- user cannot create completed job state directly;
- user cannot alter provider/model/cost fields;
- user reads only own results;
- result approval never writes to shared catalogue;
- usage ledger remains inaccessible to client.

### Notifications

- user cannot create arbitrary notification;
- user cannot inspect push tokens;
- mark-read operation affects only own notification;
- FCM delivery failure does not remove in-app record.

---

## 11. Policy Performance and Review

Policy columns require indexes, especially `user_id`.

Before private beta:

- run Supabase database advisors;
- inspect unindexed foreign-key warnings;
- inspect duplicate or unused indexes;
- verify RLS is enabled wherever a policy exists;
- inspect security-definer views/functions;
- inspect mutable function `search_path`;
- ensure sensitive private tables are not exposed.

Supabase provides database advisors for issues such as unindexed foreign keys, disabled RLS, insecure security-definer objects and sensitive columns. citeturn624492search18

---

## 12. Decision Status

Approved:

- shared catalogue readable but not user-writable;
- private owner-scoped data;
- private operational schema;
- no anonymous product-data access in Web v1;
- separate shared/custom component tables;
- no unified component database view for Web v1;
- no Supabase Realtime by default;
- protected generation of activity, milestones, jobs and notifications.

Still to design:

- exact narrow RPC SQL;
- final account-deletion function;
- Storage object policies;
- username resolver;
- versioned mutation RPCs;
- AI result-approval transaction;
- notification dispatcher permissions.

---

## 13. Acceptance Gate

This RLS draft is ready to become executable policy SQL when:

- [ ] policy names and table privileges are reviewed;
- [ ] all client mutation paths are identified;
- [ ] broad updates are replaced with narrow functions where necessary;
- [ ] owner/non-owner tests are written;
- [ ] Storage RLS is specified;
- [ ] private schema remains unexposed;
- [ ] security-definer functions are reviewed individually;
- [ ] local Supabase policy tests pass.

Do not apply these policies to production before the local test suite passes.
