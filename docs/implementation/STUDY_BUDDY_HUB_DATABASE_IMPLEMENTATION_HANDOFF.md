# Study Buddy Hub — Database Implementation Handoff

**Status:** Ready for agent execution after owner setup  
**Purpose:** Convert the reviewed Stage 3 database architecture into locally validated Supabase migrations and tests  
**Target agent:** Devin, Cursor Agent, or another repository-connected coding agent  
**Canonical package manager:** npm  
**Important:** Do not push to a remote Supabase project until all local gates pass

---

## 1. Source Documents

Treat these repository files as the current database source of truth:

- `docs/STUDY_BUDDY_HUB_STAGE_3_ARCHITECTURE_PLAN_DRAFT_3.md`
- `docs/STUDY_BUDDY_HUB_STAGE_3_REPOSITORY_ARCHITECTURE_AUDIT.md`
- `docs/architecture/STUDY_BUDDY_HUB_STAGE_3_DATABASE_REVIEW_FINDINGS.md`
- `docs/architecture/STUDY_BUDDY_HUB_STAGE_3_DATABASE_SCHEMA_DRAFT_3_REVIEWED.md`
- `docs/architecture/STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql`
- `docs/architecture/STUDY_BUDDY_HUB_STAGE_3_RLS_POLICY_MATRIX_DRAFT_3_REVIEWED.md`

Do not treat Draft 1 or Draft 2 as current implementation specifications.

---

## 2. Owner Setup Required Before Agent Work

The project owner should:

1. Create a Supabase account.
2. Create one remote project named clearly as a development environment, for example:
   - `study-buddy-hub-dev`
3. Save the database password in a password manager.
4. Do not create production tables manually in the Supabase Dashboard.
5. Do not configure production OAuth providers yet.
6. Do not put service-role or secret keys in GitHub, source code, prompts, screenshots or chat.
7. Install Docker Desktop or another Docker-compatible container runtime if the agent will run locally on the owner's machine.
8. Ensure Node.js 20 or later and npm are available.

The agent can begin local work before the remote development project is linked.

---

## 3. Agent Mission

Convert the reviewed monolithic SQL architecture draft into a clean, reproducible, locally tested Supabase setup.

The agent must:

- work on a dedicated Git branch;
- initialise the Supabase CLI locally;
- split the SQL into ordered migration files;
- execute the full migration chain from a clean local database;
- fix only evidenced SQL/runtime issues;
- write database and RLS tests;
- create safe development seed data;
- generate TypeScript database types;
- document all changes;
- stop before remote deployment unless the project owner explicitly authorises it.

---

## 4. Required Branch

Create a branch such as:

```bash
git checkout -b feat/supabase-database-foundation
```

Do not work directly on `main`.

---

## 5. Local Tooling Setup

From the repository root:

```bash
node --version
npm --version
docker --version
```

Node.js must be version 20 or later.

Install the Supabase CLI as a project dependency:

```bash
npm install --save-dev supabase
```

Initialise the local Supabase project:

```bash
npx supabase init
```

Start the local stack:

```bash
npx supabase start
```

The generated `supabase/config.toml` and approved Supabase source files should be committed. Do not commit `.temp`, local secrets or generated private credentials.

---

## 6. Migration Split

Do not place the full 3,000-line draft into one migration.

Split it into ordered migration files under `supabase/migrations/`.

Recommended order:

1. `extensions_and_private_schema`
2. `common_helper_functions`
3. `shared_catalogue_tables`
4. `profiles_and_account_preferences`
5. `subjects_and_subject_limit`
6. `syllabus_nodes_progress_and_notes`
7. `components_and_paper_attempts`
8. `reflections_activity_and_planning`
9. `document_ai_and_import_tables`
10. `notifications_and_private_integrations`
11. `cross_table_validation_functions`
12. `versioned_mutation_functions`
13. `soft_delete_functions`
14. `indexes_and_triggers`
15. `table_grants`
16. `row_level_security_policies`
17. `storage_bucket_and_storage_policies`
18. `development_seed_baseline`

Dependencies must be verified rather than copied blindly.

---

## 7. Local Validation Loop

After each meaningful migration group:

```bash
npx supabase db reset
```

The complete chain must rebuild from zero without manual Dashboard changes.

Also run:

```bash
npx supabase migration list
npx supabase db lint
```

Record every error and correction.

Do not suppress an error without explaining its cause.

---

## 8. Required Database Tests

Create pgTAP tests under:

```text
supabase/tests/database/
```

At minimum, test:

### Authentication and profiles

- profile row created safely after Auth signup;
- username is initially nullable;
- username claim is case-insensitively unique;
- reserved usernames are rejected;
- one user cannot change another user's profile;
- signup is not blocked by a username collision.

### Shared catalogue

- authenticated user can read approved active catalogue data;
- anonymous user cannot read product data;
- authenticated user cannot modify shared catalogue data;
- inactive/draft visibility matches the approved design;
- catalogue size is not limited to seven subjects.

### User subjects

- user can create subjects through the protected function;
- eighth active subject is rejected;
- two simultaneous seventh/eighth operations cannot both succeed;
- direct insertion cannot bypass the seven-subject rule;
- unarchiving or restoring cannot bypass the rule;
- one user cannot reference another user's custom subject.

### Syllabus and notes

- owner can read and mutate own progress and notes;
- non-owner is denied;
- shared node must belong to the selected syllabus version;
- custom node parent must belong to the same user and subject;
- hierarchy cycles are rejected;
- stale base versions are rejected;
- soft deletion creates tombstones.

### Components and papers

- shared component must belong to the selected syllabus;
- custom component must belong to the user;
- score cannot exceed maximum marks;
- past-paper year cannot be before 1900 or after the current year;
- generated percentage is correct;
- owner can soft-delete a paper attempt;
- non-owner cannot delete it;
- deleting a custom component preserves historical paper attempts and snapshots.

### Offline/idempotency

- repeated `client_operation_id` does not create duplicates;
- direct-insert retry behaviour returns or re-fetches the existing row;
- stale update returns a conflict;
- stale delete returns a conflict;
- successful update increments version once.

### AI and documents

- user cannot write provider/model/cost fields directly;
- user cannot access another user's job or result;
- AI result approval writes only private custom data;
- usage ledger is inaccessible to the client;
- Storage object paths are user-scoped;
- direct Storage metadata deletion is unavailable.

### Notifications and integrations

- user cannot fabricate notifications or milestones;
- user can mark only their own notification as read;
- FCM tokens are inaccessible through the client Data API;
- private schemas are not exposed;
- integration ownership cannot cross users.

---

## 9. Seed Data

Create safe development-only seed data containing:

- Cambridge International exam board;
- A-Level qualification;
- a very small number of catalogue subjects;
- one or two syllabus versions;
- sample syllabus nodes;
- sample official components.

Do not seed real user personal data.

Do not seed all catalogue subjects yet.

Seed data must be deterministic and safe to replay.

---

## 10. TypeScript Types

After the database resets successfully:

```bash
npx supabase gen types typescript --local > src/integrations/supabase/database.types.ts
```

Add an application mapping layer so generated database rows are not used directly as domain types everywhere.

Keep the approved unified `ExamComponent` model in the repository/service layer.

---

## 11. Application Environment

For local development, use the local URL and publishable/anonymous key returned by:

```bash
npx supabase status
```

Create a non-committed environment file using the project's Vite naming convention:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Never add a service-role, secret or database password to a `VITE_` variable.

Ensure environment files containing values are ignored by Git.

---

## 12. Remote Development Project — Owner Authorisation Gate

Do not link or push remotely until:

- every migration rebuilds locally;
- all database tests pass;
- RLS tests pass;
- Storage policies pass;
- generated types succeed;
- the project owner approves the local validation report.

After approval:

```bash
npx supabase login
npx supabase link --project-ref <development-project-ref>
npx supabase db push --dry-run
```

Show the dry-run output to the project owner.

Only after explicit approval:

```bash
npx supabase db push
```

Never run `db reset --linked` without explicit confirmation that the linked project is disposable development infrastructure.

---

## 13. GitHub Integration

Do not enable automatic production deployment at the beginning.

After the `supabase/` directory, migrations and tests are stable:

1. optionally connect the Supabase development project to the GitHub repository;
2. use repository root `.` as the working directory when `supabase/` is at the root;
3. enable migration checks on pull requests;
4. do not enable deploy-to-production yet;
5. do not enable paid preview branching without owner approval.

GitHub Actions should run database tests on pull requests before migrations are merged.

---

## 14. Lovable Integration

Lovable should not be the first environment used to validate the database SQL.

Connect Lovable only after:

- the remote development project has the validated migrations;
- Auth and RLS have been tested;
- local application queries work;
- development environment variables are ready.

Lovable must connect to the development project, not a future production project.

---

## 15. Notion / Project Board Structure

Create or update a database implementation board with these statuses:

- Backlog
- Ready
- In Progress
- Technical Review
- Owner Review
- Blocked
- Done

Recommended cards:

1. Install local Supabase tooling
2. Initialise `supabase/`
3. Split reviewed SQL into migrations
4. Validate clean database reset
5. Implement RLS policies
6. Implement Storage policies
7. Create Auth/profile tests
8. Create catalogue tests
9. Create subject-limit tests
10. Create ownership/RLS tests
11. Create offline conflict tests
12. Create AI/document tests
13. Create notification tests
14. Add development seed data
15. Generate TypeScript database types
16. Produce local validation report
17. Owner approval for remote development link
18. Dry-run remote migration push
19. Push to remote development project
20. Connect frontend to development Supabase
21. Connect Lovable to development Supabase
22. Add GitHub database-test workflow

Each card should contain:

- purpose;
- dependencies;
- files changed;
- verification command;
- acceptance criteria;
- risks;
- completion evidence.

---

## 16. Required Agent Report

Before requesting remote authorisation, provide:

### Files changed

List every created or modified file.

### Migration order

List each migration filename and purpose.

### Commands run

Include exact commands and exit results.

### Corrections made

For every deviation from SQL Draft 3, state:

- original issue;
- evidence;
- correction;
- effect on architecture.

### Test results

Report:

- clean reset;
- migration status;
- lint;
- pgTAP tests;
- RLS owner/non-owner tests;
- Storage tests;
- TypeScript generation.

### Remaining risks

Separate:

- blockers;
- non-blocking follow-ups;
- deliberately deferred work.

### Remote recommendation

Choose one:

- ready for remote development dry run;
- requires further local revision;
- blocked by owner/environment dependency.

---

## 17. Stop Conditions

Stop and report before continuing when:

- Docker cannot start;
- the Supabase CLI version is incompatible;
- a migration requires changing an approved product decision;
- a security policy cannot be implemented as specified;
- a test exposes cross-user access;
- the database cannot rebuild cleanly;
- the agent needs remote credentials or owner approval;
- a destructive linked-remote command would be required.

Do not weaken RLS, remove tests or bypass migrations to force a pass.
