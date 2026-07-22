-- Study Buddy Hub — Stage 3 Database SQL Draft 2 Reviewed
-- Status: TECHNICALLY REVISED REVIEW DRAFT. LOCAL VALIDATION REQUIRED BEFORE MIGRATION USE.
-- Target: Supabase PostgreSQL
-- Parent specification:
-- docs/architecture/STUDY_BUDDY_HUB_STAGE_3_DATABASE_SCHEMA_DRAFT_2_APPROVED.md
--
-- This draft establishes tables, constraints, indexes and helper functions.
-- RLS policies are specified separately in:
-- docs/architecture/STUDY_BUDDY_HUB_STAGE_3_RLS_POLICY_MATRIX_DRAFT_2_REVIEWED.md
--
-- Important:
-- 1. Test from a clean local Supabase database.
-- 2. Review generated diffs before committing migrations.
-- 3. Keep private schema out of exposed Data API schemas.
-- 4. Do not expose service-role credentials to the browser.

begin;

-- ============================================================
-- 001. EXTENSIONS AND SCHEMAS
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

create table if not exists private.reserved_usernames (
  username text primary key,
  created_at timestamptz not null default now(),
  constraint reserved_usernames_lowercase check (username = lower(username)),
  constraint reserved_usernames_format check (username ~ '^[a-z0-9._]+$')
);

insert into private.reserved_usernames (username)
values
  ('admin'), ('administrator'), ('api'), ('app'), ('auth'),
  ('help'), ('moderator'), ('root'), ('security'), ('staff'),
  ('studybuddy'), ('support'), ('system')
on conflict do nothing;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to service_role;

-- ============================================================
-- 002. COMMON HELPER FUNCTIONS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.bump_record_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new is distinct from old then
    new.version = old.version + 1;
  end if;
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.bump_record_version() from public, anon, authenticated;

-- ============================================================
-- 003. SHARED ACADEMIC CATALOGUE
-- ============================================================

create table public.exam_boards (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  website_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_boards_code_length check (char_length(code) between 2 and 20),
  constraint exam_boards_name_length check (char_length(name) between 2 and 120),
  constraint exam_boards_code_unique unique (code)
);

create table public.qualifications (
  id uuid primary key default gen_random_uuid(),
  exam_board_id uuid not null references public.exam_boards(id) on delete restrict,
  code text not null,
  name text not null,
  level_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qualifications_code_nonempty check (char_length(btrim(code)) > 0),
  constraint qualifications_name_nonempty check (char_length(btrim(name)) > 0),
  constraint qualifications_level_nonempty check (char_length(btrim(level_label)) > 0),
  constraint qualifications_board_code_unique unique (exam_board_id, code)
);

create table public.catalogue_subjects (
  id uuid primary key default gen_random_uuid(),
  qualification_id uuid not null references public.qualifications(id) on delete restrict,
  code text not null,
  slug text not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalogue_subjects_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint catalogue_subjects_name_length
    check (char_length(name) between 2 and 120),
  constraint catalogue_subjects_qualification_code_unique
    unique (qualification_id, code),
  constraint catalogue_subjects_qualification_slug_unique
    unique (qualification_id, slug)
);

create table public.syllabuses (
  id uuid primary key default gen_random_uuid(),
  catalogue_subject_id uuid not null
    references public.catalogue_subjects(id) on delete restrict,
  syllabus_code text not null,
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint syllabuses_subject_code_unique
    unique (catalogue_subject_id, syllabus_code),
  constraint syllabuses_title_nonempty
    check (char_length(btrim(title)) > 0)
);

create table public.syllabus_versions (
  id uuid primary key default gen_random_uuid(),
  syllabus_id uuid not null references public.syllabuses(id) on delete restrict,
  version_label text not null,
  valid_from_year smallint not null,
  valid_to_year smallint not null,
  status text not null default 'draft',
  source_reference text,
  source_sha256 text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint syllabus_versions_years_valid
    check (
      valid_from_year between 1900 and 9999
      and valid_to_year between valid_from_year and 9999
    ),
  constraint syllabus_versions_status_valid
    check (status in ('draft', 'active', 'retired')),
  constraint syllabus_versions_sha256_valid
    check (
      source_sha256 is null
      or source_sha256 ~ '^[a-f0-9]{64}$'
    ),
  constraint syllabus_versions_label_unique
    unique (syllabus_id, version_label)
);

create table public.syllabus_nodes (
  id uuid primary key default gen_random_uuid(),
  syllabus_version_id uuid not null
    references public.syllabus_versions(id) on delete cascade,
  parent_id uuid,
  node_type text not null,
  node_code text,
  title text not null,
  description text,
  sort_order integer not null default 0,
  source_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint syllabus_nodes_type_valid
    check (node_type in ('section', 'topic', 'subtopic', 'learning_outcome')),
  constraint syllabus_nodes_title_nonempty
    check (char_length(btrim(title)) > 0),
  constraint syllabus_nodes_sort_order_nonnegative
    check (sort_order >= 0),
  constraint syllabus_nodes_id_version_unique
    unique (id, syllabus_version_id),
  constraint syllabus_nodes_parent_version_fk
    foreign key (parent_id, syllabus_version_id)
    references public.syllabus_nodes(id, syllabus_version_id)
    on delete cascade
);

create table public.syllabus_components (
  id uuid primary key default gen_random_uuid(),
  syllabus_version_id uuid not null
    references public.syllabus_versions(id) on delete cascade,
  name text not null,
  paper_code text,
  duration_minutes smallint,
  total_marks numeric(8,2),
  weighting_percent numeric(5,2),
  display_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint syllabus_components_name_nonempty
    check (char_length(btrim(name)) > 0),
  constraint syllabus_components_duration_positive
    check (duration_minutes is null or duration_minutes > 0),
  constraint syllabus_components_marks_positive
    check (total_marks is null or total_marks > 0),
  constraint syllabus_components_weighting_valid
    check (weighting_percent is null or weighting_percent between 0 and 100),
  constraint syllabus_components_order_nonnegative
    check (display_order >= 0)
);

-- ============================================================
-- 004. PROFILES AND USER SUBJECTS
-- ============================================================

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  onboarding_status text not null default 'not_started',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length
    check (username is null or char_length(username) between 3 and 30),
  constraint profiles_username_format
    check (username is null or username ~ '^[A-Za-z0-9._]+$'),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) <= 80),
  constraint profiles_onboarding_status_valid
    check (onboarding_status in ('not_started', 'in_progress', 'completed'))
);

create unique index profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

create table public.custom_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text,
  qualification_label text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint custom_subjects_name_length
    check (char_length(name) between 2 and 120),
  constraint custom_subjects_id_user_unique
    unique (id, user_id)
);

create table public.user_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalogue_subject_id uuid
    references public.catalogue_subjects(id) on delete restrict,
  custom_subject_id uuid,
  syllabus_version_id uuid
    references public.syllabus_versions(id) on delete restrict,
  display_name_override text,
  sort_order smallint not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint user_subjects_exactly_one_subject
    check (
      (catalogue_subject_id is not null)::integer
      + (custom_subject_id is not null)::integer
      = 1
    ),
  constraint user_subjects_catalogue_syllabus_consistency
    check (
      catalogue_subject_id is not null
      or syllabus_version_id is null
    ),
  constraint user_subjects_sort_order_valid
    check (sort_order between 0 and 99),
  constraint user_subjects_id_user_unique
    unique (id, user_id),
  constraint user_subjects_custom_subject_owner_fk
    foreign key (custom_subject_id, user_id)
    references public.custom_subjects(id, user_id)
    on delete restrict
);

-- ============================================================
-- 005. CUSTOM SYLLABUS, PROGRESS AND NOTES
-- ============================================================

create table public.custom_syllabus_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_subject_id uuid not null,
  parent_id uuid,
  node_type text not null,
  node_code text,
  title text not null,
  description text,
  sort_order integer not null default 0,
  source_type text not null default 'manual',
  source_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint custom_syllabus_nodes_subject_owner_fk
    foreign key (user_subject_id, user_id)
    references public.user_subjects(id, user_id)
    on delete cascade,
  constraint custom_syllabus_nodes_id_user_unique
    unique (id, user_id),
  constraint custom_syllabus_nodes_id_subject_user_unique
    unique (id, user_subject_id, user_id),
  constraint custom_syllabus_nodes_parent_owner_fk
    foreign key (parent_id, user_subject_id, user_id)
    references public.custom_syllabus_nodes(id, user_subject_id, user_id)
    on delete cascade,
  constraint custom_syllabus_nodes_type_valid
    check (node_type in ('section', 'topic', 'subtopic', 'learning_outcome')),
  constraint custom_syllabus_nodes_source_valid
    check (source_type in ('manual', 'csv', 'pdf_ai', 'legacy')),
  constraint custom_syllabus_nodes_title_nonempty
    check (char_length(btrim(title)) > 0),
  constraint custom_syllabus_nodes_order_nonnegative
    check (sort_order >= 0)
);

create table public.user_syllabus_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_subject_id uuid not null,
  syllabus_node_id uuid references public.syllabus_nodes(id) on delete cascade,
  custom_syllabus_node_id uuid,
  confidence_status text,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint user_syllabus_progress_subject_owner_fk
    foreign key (user_subject_id, user_id)
    references public.user_subjects(id, user_id)
    on delete cascade,
  constraint user_syllabus_progress_custom_node_owner_fk
    foreign key (custom_syllabus_node_id, user_subject_id, user_id)
    references public.custom_syllabus_nodes(id, user_subject_id, user_id)
    on delete cascade,
  constraint user_syllabus_progress_exactly_one_target
    check (
      (syllabus_node_id is not null)::integer
      + (custom_syllabus_node_id is not null)::integer
      = 1
    ),
  constraint user_syllabus_progress_confidence_valid
    check (confidence_status is null or confidence_status in ('red', 'amber', 'green'))
);

create table public.syllabus_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_subject_id uuid not null,
  syllabus_node_id uuid references public.syllabus_nodes(id) on delete cascade,
  custom_syllabus_node_id uuid,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint syllabus_notes_subject_owner_fk
    foreign key (user_subject_id, user_id)
    references public.user_subjects(id, user_id)
    on delete cascade,
  constraint syllabus_notes_custom_node_owner_fk
    foreign key (custom_syllabus_node_id, user_subject_id, user_id)
    references public.custom_syllabus_nodes(id, user_subject_id, user_id)
    on delete cascade,
  constraint syllabus_notes_exactly_one_target
    check (
      (syllabus_node_id is not null)::integer
      + (custom_syllabus_node_id is not null)::integer
      = 1
    ),
  constraint syllabus_notes_content_length
    check (char_length(content) <= 20000)
);

-- ============================================================
-- 006. COMPONENTS AND PAST-PAPER ATTEMPTS
-- ============================================================

create table public.custom_components (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_subject_id uuid not null,
  name text not null,
  paper_code text,
  duration_minutes smallint,
  total_marks numeric(8,2),
  weighting_percent numeric(5,2),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint custom_components_subject_owner_fk
    foreign key (user_subject_id, user_id)
    references public.user_subjects(id, user_id)
    on delete cascade,
  constraint custom_components_id_user_unique
    unique (id, user_id),
  constraint custom_components_id_subject_user_unique
    unique (id, user_subject_id, user_id),
  constraint custom_components_name_nonempty
    check (char_length(btrim(name)) > 0),
  constraint custom_components_duration_positive
    check (duration_minutes is null or duration_minutes > 0),
  constraint custom_components_marks_positive
    check (total_marks is null or total_marks > 0),
  constraint custom_components_weighting_valid
    check (weighting_percent is null or weighting_percent between 0 and 100),
  constraint custom_components_order_nonnegative
    check (display_order >= 0)
);

create table public.paper_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_subject_id uuid not null,
  syllabus_component_id uuid
    references public.syllabus_components(id) on delete restrict,
  custom_component_id uuid,
  component_name_snapshot text,
  paper_code_snapshot text,
  paper_year smallint,
  session text,
  variant text,
  attempt_date date not null default current_date,
  score numeric(8,2) not null,
  max_marks numeric(8,2) not null,
  percentage numeric(6,2)
    generated always as (
      round((score / nullif(max_marks, 0)) * 100, 2)
    ) stored,
  duration_minutes smallint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint paper_attempts_subject_owner_fk
    foreign key (user_subject_id, user_id)
    references public.user_subjects(id, user_id)
    on delete cascade,
  constraint paper_attempts_custom_component_owner_fk
    foreign key (custom_component_id, user_subject_id, user_id)
    references public.custom_components(id, user_subject_id, user_id)
    on delete restrict,
  constraint paper_attempts_at_most_one_component
    check (
      (syllabus_component_id is not null)::integer
      + (custom_component_id is not null)::integer
      <= 1
    ),
  constraint paper_attempts_score_valid
    check (score >= 0 and max_marks > 0 and score <= max_marks),
  constraint paper_attempts_year_lower_bound
    check (paper_year is null or paper_year >= 1900),
  constraint paper_attempts_session_valid
    check (session is null or session in ('feb_mar', 'may_jun', 'oct_nov', 'other')),
  constraint paper_attempts_duration_positive
    check (duration_minutes is null or duration_minutes > 0),
  constraint paper_attempts_notes_length
    check (notes is null or char_length(notes) <= 20000)
);

-- Current-year upper validation for paper_year is implemented in a trigger,
-- because CHECK constraints must not depend on a changing current date.

create or replace function public.validate_paper_attempt_year()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.paper_year is not null
     and new.paper_year > extract(year from current_date)::smallint then
    raise exception 'paper_year cannot be in the future';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_paper_attempt_year()
  from public, anon, authenticated;

-- ============================================================
-- 007. REFLECTIONS, ACTIVITY, MILESTONES AND PLANNING
-- ============================================================

create table public.weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  wins text,
  challenges text,
  next_steps text,
  rating smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint weekly_reflections_rating_valid
    check (rating is null or rating between 1 and 5)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  source_operation_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint activity_events_metadata_object
    check (jsonb_typeof(metadata) = 'object')
);

create table public.user_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone_code text not null,
  achieved_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint user_milestones_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint user_milestones_user_code_unique
    unique (user_id, milestone_code)
);

create table public.chapter_deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_subject_id uuid not null,
  syllabus_node_id uuid references public.syllabus_nodes(id) on delete cascade,
  custom_syllabus_node_id uuid,
  title_override text,
  due_at timestamptz not null,
  status text not null default 'planned',
  reminder_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint chapter_deadlines_subject_owner_fk
    foreign key (user_subject_id, user_id)
    references public.user_subjects(id, user_id)
    on delete cascade,
  constraint chapter_deadlines_custom_node_owner_fk
    foreign key (custom_syllabus_node_id, user_subject_id, user_id)
    references public.custom_syllabus_nodes(id, user_subject_id, user_id)
    on delete cascade,
  constraint chapter_deadlines_exactly_one_target
    check (
      (syllabus_node_id is not null)::integer
      + (custom_syllabus_node_id is not null)::integer
      = 1
    ),
  constraint chapter_deadlines_status_valid
    check (status in ('planned', 'completed', 'dismissed'))
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_subject_id uuid,
  event_type text not null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  is_all_day boolean not null default false,
  timezone text,
  source_entity_type text,
  source_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  client_operation_id uuid,
  constraint calendar_events_subject_fk
    foreign key (user_subject_id)
    references public.user_subjects(id)
    on delete set null,
  constraint calendar_events_type_valid
    check (event_type in ('exam', 'deadline', 'study', 'other')),
  constraint calendar_events_time_valid
    check (end_at is null or end_at >= start_at),
  constraint calendar_events_title_nonempty
    check (char_length(btrim(title)) > 0),
  constraint calendar_events_id_user_unique
    unique (id, user_id)
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  locale text not null default 'en',
  week_starts_on smallint not null default 1,
  sync_appearance_preferences boolean not null default false,
  ai_processing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_week_start_valid
    check (week_starts_on between 0 and 6)
);

-- ============================================================
-- 008. DOCUMENTS, AI AND IMPORTS
-- ============================================================

create table public.document_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  sha256 text,
  status text not null default 'uploaded',
  retention_until timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint document_uploads_storage_path_unique unique (storage_path),
  constraint document_uploads_id_user_unique unique (id, user_id),
  constraint document_uploads_size_positive check (size_bytes > 0),
  constraint document_uploads_mime_valid
    check (mime_type in ('application/pdf')),
  constraint document_uploads_sha256_valid
    check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  constraint document_uploads_status_valid
    check (status in ('uploaded', 'processing', 'processed', 'failed', 'deleted'))
);

create table public.ai_extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_upload_id uuid not null,
  user_subject_id uuid,
  status text not null default 'queued',
  processing_strategy text,
  provider_name text,
  model_name text,
  attempt_count smallint not null default 0,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_extraction_jobs_document_owner_fk
    foreign key (document_upload_id, user_id)
    references public.document_uploads(id, user_id)
    on delete cascade,
  constraint ai_extraction_jobs_subject_fk
    foreign key (user_subject_id)
    references public.user_subjects(id)
    on delete set null,
  constraint ai_extraction_jobs_attempt_nonnegative
    check (attempt_count >= 0),
  constraint ai_extraction_jobs_status_valid
    check (
      status in (
        'queued', 'processing', 'review_required',
        'completed', 'failed', 'cancelled'
      )
    ),
  constraint ai_extraction_jobs_id_user_unique
    unique (id, user_id)
);

create table public.ai_extraction_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null,
  schema_version text not null,
  result_json jsonb not null,
  validation_status text not null,
  validation_errors jsonb not null default '[]'::jsonb,
  review_status text not null default 'pending',
  topic_count integer not null default 0,
  component_count integer not null default 0,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_extraction_results_result_object
    check (jsonb_typeof(result_json) = 'object'),
  constraint ai_extraction_results_errors_array
    check (jsonb_typeof(validation_errors) = 'array'),
  constraint ai_extraction_results_validation_status_valid
    check (validation_status in ('valid', 'repaired', 'invalid')),
  constraint ai_extraction_results_review_status_valid
    check (review_status in ('pending', 'approved', 'rejected')),
  constraint ai_extraction_results_counts_nonnegative
    check (topic_count >= 0 and component_count >= 0),
  constraint ai_extraction_results_job_unique
    unique (job_id),
  constraint ai_extraction_results_job_owner_fk
    foreign key (job_id, user_id)
    references public.ai_extraction_jobs(id, user_id)
    on delete cascade
);

create table private.ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid,
  provider_name text not null,
  model_name text not null,
  operation_type text not null,
  input_units bigint,
  output_units bigint,
  estimated_cost_usd numeric(12,6),
  chargeable_to_allowance boolean not null default true,
  provider_request_id text,
  occurred_at timestamptz not null default now(),
  constraint ai_usage_ledger_units_valid
    check (
      (input_units is null or input_units >= 0)
      and (output_units is null or output_units >= 0)
    ),
  constraint ai_usage_ledger_cost_valid
    check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  constraint ai_usage_ledger_job_fk
    foreign key (job_id)
    references public.ai_extraction_jobs(id)
    on delete set null
);

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_hash text,
  status text not null default 'preview',
  preview_summary jsonb not null default '{}'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  error_summary jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_runs_source_type_valid
    check (source_type in ('legacy_local', 'json', 'csv', 'ai')),
  constraint import_runs_status_valid
    check (
      status in (
        'preview', 'confirmed', 'running', 'completed',
        'partial', 'failed', 'cancelled'
      )
    ),
  constraint import_runs_preview_object
    check (jsonb_typeof(preview_summary) = 'object'),
  constraint import_runs_result_object
    check (jsonb_typeof(result_summary) = 'object'),
  constraint import_runs_errors_array
    check (jsonb_typeof(error_summary) = 'array')
);

-- ============================================================
-- 009. NOTIFICATIONS AND FUTURE INTEGRATIONS
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_payload_object
    check (jsonb_typeof(payload) = 'object'),
  constraint notifications_title_nonempty
    check (char_length(btrim(title)) > 0),
  constraint notifications_body_nonempty
    check (char_length(btrim(body)) > 0),
  constraint notifications_id_user_unique
    unique (id, user_id)
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default false,
  email_enabled boolean not null default false,
  ai_job_updates boolean not null default true,
  sync_conflicts boolean not null default true,
  migration_updates boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null,
  status text not null default 'pending',
  attempt_count smallint not null default 0,
  provider_message_id text,
  last_error_code text,
  next_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_channel_valid
    check (channel in ('push', 'email')),
  constraint notification_deliveries_status_valid
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  constraint notification_deliveries_attempt_nonnegative
    check (attempt_count >= 0),
  constraint notification_deliveries_notification_owner_fk
    foreign key (notification_id, user_id)
    references public.notifications(id, user_id)
    on delete cascade
);

create table private.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  token_hash text not null unique,
  platform text,
  browser_label text,
  device_label text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.external_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null,
  external_account_id text,
  granted_scopes text[] not null default '{}',
  secret_reference text,
  connected_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_integrations_status_valid
    check (status in ('connected', 'expired', 'revoked', 'error')),
  constraint external_integrations_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint external_integrations_id_user_unique
    unique (id, user_id)
);

create table private.external_calendar_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null,
  calendar_event_id uuid not null,
  external_calendar_id text,
  external_event_id text not null,
  sync_status text not null,
  last_synced_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_calendar_links_sync_status_valid
    check (sync_status in ('synced', 'pending', 'conflict', 'error', 'deleted')),
  constraint external_calendar_links_integration_event_unique
    unique (integration_id, calendar_event_id),
  constraint external_calendar_links_external_event_unique
    unique (integration_id, external_event_id),
  constraint external_calendar_links_integration_owner_fk
    foreign key (integration_id, user_id)
    references private.external_integrations(id, user_id)
    on delete cascade,
  constraint external_calendar_links_event_owner_fk
    foreign key (calendar_event_id, user_id)
    references public.calendar_events(id, user_id)
    on delete cascade
);

-- ============================================================
-- 010. CROSS-TABLE VALIDATION FUNCTIONS
-- ============================================================

create or replace function public.validate_user_subject_links()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_catalogue_subject_id uuid;
begin
  if new.catalogue_subject_id is not null then
    if new.syllabus_version_id is null then
      return new;
    end if;

    select s.catalogue_subject_id
      into v_catalogue_subject_id
      from public.syllabus_versions sv
      join public.syllabuses s on s.id = sv.syllabus_id
      where sv.id = new.syllabus_version_id;

    if v_catalogue_subject_id is distinct from new.catalogue_subject_id then
      raise exception 'Selected syllabus version does not belong to selected catalogue subject';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_shared_syllabus_target()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_selected_version uuid;
  v_node_version uuid;
begin
  if new.syllabus_node_id is null then
    return new;
  end if;

  select us.syllabus_version_id
    into v_selected_version
    from public.user_subjects us
    where us.id = new.user_subject_id
      and us.user_id = new.user_id
      and us.deleted_at is null;

  select sn.syllabus_version_id
    into v_node_version
    from public.syllabus_nodes sn
    where sn.id = new.syllabus_node_id;

  if v_selected_version is null
     or v_node_version is distinct from v_selected_version then
    raise exception 'Syllabus node does not belong to the selected syllabus version';
  end if;

  return new;
end;
$$;

create or replace function public.validate_shared_component_target()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_selected_version uuid;
  v_component_version uuid;
begin
  if new.syllabus_component_id is null then
    return new;
  end if;

  select us.syllabus_version_id
    into v_selected_version
    from public.user_subjects us
    where us.id = new.user_subject_id
      and us.user_id = new.user_id
      and us.deleted_at is null;

  select sc.syllabus_version_id
    into v_component_version
    from public.syllabus_components sc
    where sc.id = new.syllabus_component_id;

  if v_selected_version is null
     or v_component_version is distinct from v_selected_version then
    raise exception 'Component does not belong to the selected syllabus version';
  end if;

  return new;
end;
$$;

revoke execute on function public.validate_user_subject_links()
  from public, anon, authenticated;
revoke execute on function public.validate_shared_syllabus_target()
  from public, anon, authenticated;
revoke execute on function public.validate_shared_component_target()
  from public, anon, authenticated;

-- Validate optional subject references where ON DELETE SET NULL must preserve user_id.
create or replace function public.validate_optional_user_subject_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.user_subject_id is not null and not exists (
    select 1
    from public.user_subjects us
    where us.id = new.user_subject_id
      and us.user_id = new.user_id
      and us.deleted_at is null
  ) then
    raise exception 'Referenced user subject does not belong to the current owner';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_shared_syllabus_node_cycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A syllabus node cannot be its own parent';
  end if;

  if exists (
    with recursive ancestors as (
      select sn.id, sn.parent_id
      from public.syllabus_nodes sn
      where sn.id = new.parent_id
        and sn.syllabus_version_id = new.syllabus_version_id
      union all
      select parent.id, parent.parent_id
      from public.syllabus_nodes parent
      join ancestors a on a.parent_id = parent.id
      where parent.syllabus_version_id = new.syllabus_version_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'Syllabus node hierarchy cannot contain a cycle';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_custom_syllabus_node_cycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A custom syllabus node cannot be its own parent';
  end if;

  if exists (
    with recursive ancestors as (
      select csn.id, csn.parent_id
      from public.custom_syllabus_nodes csn
      where csn.id = new.parent_id
        and csn.user_subject_id = new.user_subject_id
        and csn.user_id = new.user_id
      union all
      select parent.id, parent.parent_id
      from public.custom_syllabus_nodes parent
      join ancestors a on a.parent_id = parent.id
      where parent.user_subject_id = new.user_subject_id
        and parent.user_id = new.user_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'Custom syllabus hierarchy cannot contain a cycle';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_active_subject_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if new.deleted_at is not null or new.is_archived = true then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select count(*)
  into v_count
  from public.user_subjects us
  where us.user_id = new.user_id
    and us.deleted_at is null
    and us.is_archived = false
    and us.id <> new.id;

  if v_count >= 7 then
    raise exception 'A maximum of seven active subjects is allowed';
  end if;

  return new;
end;
$$;

revoke execute on function public.validate_optional_user_subject_owner()
  from public, anon, authenticated;
revoke execute on function public.prevent_shared_syllabus_node_cycle()
  from public, anon, authenticated;
revoke execute on function public.prevent_custom_syllabus_node_cycle()
  from public, anon, authenticated;
revoke execute on function public.enforce_active_subject_limit()
  from public, anon, authenticated;

create or replace function public.validate_optional_ai_job_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.job_id is not null and not exists (
    select 1
    from public.ai_extraction_jobs job
    where job.id = new.job_id
      and job.user_id = new.user_id
  ) then
    raise exception 'Referenced AI job does not belong to the ledger owner';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_optional_ai_job_owner()
  from public, anon, authenticated;

-- ============================================================
-- 011. PROFILE CREATION
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, username, display_name)
  values (
    new.id,
    null,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user()
  from public, anon, authenticated;

-- ============================================================
-- 012. SEVEN-SUBJECT ATOMIC CREATION FUNCTION
-- ============================================================

create or replace function public.create_user_subject(
  p_catalogue_subject_id uuid default null,
  p_custom_subject_id uuid default null,
  p_syllabus_version_id uuid default null,
  p_display_name_override text default null,
  p_sort_order smallint default 0,
  p_client_operation_id uuid default null
)
returns public.user_subjects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.user_subjects;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if (
    (p_catalogue_subject_id is not null)::integer
    + (p_custom_subject_id is not null)::integer
  ) <> 1 then
    raise exception 'Exactly one subject source is required';
  end if;

  if p_client_operation_id is not null then
    select * into v_row
    from public.user_subjects us
    where us.user_id = v_user_id
      and us.client_operation_id = p_client_operation_id;
    if found then
      return v_row;
    end if;
  end if;

  insert into public.user_subjects (
    user_id,
    catalogue_subject_id,
    custom_subject_id,
    syllabus_version_id,
    display_name_override,
    sort_order,
    client_operation_id
  )
  values (
    v_user_id,
    p_catalogue_subject_id,
    p_custom_subject_id,
    p_syllabus_version_id,
    nullif(btrim(p_display_name_override), ''),
    p_sort_order,
    p_client_operation_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.set_user_subject_archived(
  p_subject_id uuid,
  p_archived boolean,
  p_base_version bigint
)
returns public.user_subjects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.user_subjects;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.user_subjects
  set is_archived = p_archived
  where id = p_subject_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or subject not found' using errcode = '40001';
  end if;

  return v_row;
end;
$$;

create or replace function public.soft_delete_user_subject(
  p_subject_id uuid,
  p_base_version bigint
)
returns public.user_subjects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_now timestamptz := now();
  v_row public.user_subjects;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.user_subjects
  set deleted_at = v_now
  where id = p_subject_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or subject not found' using errcode = '40001';
  end if;

  update public.custom_syllabus_nodes
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.user_syllabus_progress
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.syllabus_notes
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.custom_components
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.paper_attempts
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.chapter_deadlines
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.calendar_events
    set user_subject_id = null
    where user_subject_id = p_subject_id and user_id = v_user_id;

  return v_row;
end;
$$;

create or replace function public.change_username(p_username text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_username text := lower(btrim(p_username));
  v_row public.profiles;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(v_username) not between 3 and 30
     or v_username !~ '^[a-z0-9._]+$' then
    raise exception 'Username does not meet the required format';
  end if;
  if exists (
    select 1 from private.reserved_usernames r where r.username = v_username
  ) then
    raise exception 'Username is unavailable';
  end if;

  begin
    update public.profiles
    set username = v_username
    where user_id = v_user_id
    returning * into v_row;
  exception when unique_violation then
    raise exception 'Username is unavailable';
  end;

  return v_row;
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns public.notifications
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.notifications;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id and user_id = v_user_id
  returning * into v_row;
  if not found then raise exception 'Notification not found'; end if;
  return v_row;
end;
$$;

create or replace function public.acknowledge_milestone(p_milestone_id uuid)
returns public.user_milestones
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.user_milestones;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.user_milestones
  set acknowledged_at = coalesce(acknowledged_at, now())
  where id = p_milestone_id and user_id = v_user_id
  returning * into v_row;
  if not found then raise exception 'Milestone not found'; end if;
  return v_row;
end;
$$;

create or replace function public.cancel_ai_job(p_job_id uuid)
returns public.ai_extraction_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.ai_extraction_jobs;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.ai_extraction_jobs
  set status = 'cancelled', finished_at = now()
  where id = p_job_id
    and user_id = v_user_id
    and status in ('queued', 'processing')
  returning * into v_row;
  if not found then raise exception 'Job cannot be cancelled'; end if;
  return v_row;
end;
$$;

create or replace function public.review_ai_result(
  p_job_id uuid,
  p_decision text
)
returns public.ai_extraction_results
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.ai_extraction_results;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid review decision';
  end if;

  update public.ai_extraction_results
  set review_status = p_decision,
      approved_at = case when p_decision = 'approved' then now() else null end,
      rejected_at = case when p_decision = 'rejected' then now() else null end
  where job_id = p_job_id
    and user_id = v_user_id
    and review_status = 'pending'
  returning * into v_row;

  if not found then raise exception 'Extraction result not found or already reviewed'; end if;
  return v_row;
end;
$$;

create or replace function public.register_push_device(
  p_token text,
  p_platform text default 'web',
  p_browser_label text default null,
  p_device_label text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_id uuid;
  v_hash text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(btrim(p_token)) < 20 then raise exception 'Invalid device token'; end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  insert into private.push_devices (
    user_id, token, token_hash, platform, browser_label, device_label,
    is_active, last_seen_at, revoked_at
  ) values (
    v_user_id, p_token, v_hash, p_platform, p_browser_label, p_device_label,
    true, now(), null
  )
  on conflict (token_hash) do update
  set user_id = excluded.user_id,
      token = excluded.token,
      platform = excluded.platform,
      browser_label = excluded.browser_label,
      device_label = excluded.device_label,
      is_active = true,
      last_seen_at = now(),
      revoked_at = null
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.revoke_push_device(p_device_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update private.push_devices
  set is_active = false, revoked_at = now()
  where id = p_device_id and user_id = v_user_id and is_active = true;
  return found;
end;
$$;

-- Core compare-and-swap operations for the first offline-capable milestone.
create or replace function public.set_syllabus_progress(
  p_user_subject_id uuid,
  p_syllabus_node_id uuid,
  p_custom_syllabus_node_id uuid,
  p_confidence_status text,
  p_base_version bigint default null,
  p_client_operation_id uuid default null
)
returns public.user_syllabus_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.user_syllabus_progress;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if (
    (p_syllabus_node_id is not null)::integer
    + (p_custom_syllabus_node_id is not null)::integer
  ) <> 1 then
    raise exception 'Exactly one syllabus target is required';
  end if;

  select * into v_row
  from public.user_syllabus_progress usp
  where usp.user_id = v_user_id
    and usp.user_subject_id = p_user_subject_id
    and (
      (p_syllabus_node_id is not null and usp.syllabus_node_id = p_syllabus_node_id)
      or
      (p_custom_syllabus_node_id is not null and usp.custom_syllabus_node_id = p_custom_syllabus_node_id)
    )
    and usp.deleted_at is null
  for update;

  if found then
    if p_base_version is null or v_row.version <> p_base_version then
      raise exception 'Version conflict' using errcode = '40001';
    end if;
    update public.user_syllabus_progress
    set confidence_status = p_confidence_status,
        last_reviewed_at = now()
    where id = v_row.id
    returning * into v_row;
  else
    if p_base_version is not null and p_base_version <> 0 then
      raise exception 'Version conflict' using errcode = '40001';
    end if;
    if p_client_operation_id is not null then
      select * into v_row from public.user_syllabus_progress
      where user_id = v_user_id and client_operation_id = p_client_operation_id;
      if found then return v_row; end if;
    end if;
    insert into public.user_syllabus_progress (
      user_id, user_subject_id, syllabus_node_id, custom_syllabus_node_id,
      confidence_status, last_reviewed_at, client_operation_id
    ) values (
      v_user_id, p_user_subject_id, p_syllabus_node_id,
      p_custom_syllabus_node_id, p_confidence_status, now(), p_client_operation_id
    ) returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.set_syllabus_note(
  p_user_subject_id uuid,
  p_syllabus_node_id uuid,
  p_custom_syllabus_node_id uuid,
  p_content text,
  p_base_version bigint default null,
  p_client_operation_id uuid default null
)
returns public.syllabus_notes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.syllabus_notes;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if (
    (p_syllabus_node_id is not null)::integer
    + (p_custom_syllabus_node_id is not null)::integer
  ) <> 1 then
    raise exception 'Exactly one syllabus target is required';
  end if;

  select * into v_row
  from public.syllabus_notes sn
  where sn.user_id = v_user_id
    and sn.user_subject_id = p_user_subject_id
    and (
      (p_syllabus_node_id is not null and sn.syllabus_node_id = p_syllabus_node_id)
      or
      (p_custom_syllabus_node_id is not null and sn.custom_syllabus_node_id = p_custom_syllabus_node_id)
    )
    and sn.deleted_at is null
  for update;

  if found then
    if p_base_version is null or v_row.version <> p_base_version then
      raise exception 'Version conflict' using errcode = '40001';
    end if;
    update public.syllabus_notes
    set content = p_content
    where id = v_row.id
    returning * into v_row;
  else
    if p_base_version is not null and p_base_version <> 0 then
      raise exception 'Version conflict' using errcode = '40001';
    end if;
    if p_client_operation_id is not null then
      select * into v_row from public.syllabus_notes
      where user_id = v_user_id and client_operation_id = p_client_operation_id;
      if found then return v_row; end if;
    end if;
    insert into public.syllabus_notes (
      user_id, user_subject_id, syllabus_node_id, custom_syllabus_node_id,
      content, client_operation_id
    ) values (
      v_user_id, p_user_subject_id, p_syllabus_node_id,
      p_custom_syllabus_node_id, p_content, p_client_operation_id
    ) returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.update_paper_attempt_if_version(
  p_attempt_id uuid,
  p_base_version bigint,
  p_score numeric,
  p_max_marks numeric,
  p_attempt_date date,
  p_duration_minutes smallint default null,
  p_notes text default null
)
returns public.paper_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.paper_attempts;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.paper_attempts
  set score = p_score,
      max_marks = p_max_marks,
      attempt_date = p_attempt_date,
      duration_minutes = p_duration_minutes,
      notes = p_notes
  where id = p_attempt_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or attempt not found' using errcode = '40001';
  end if;
  return v_row;
end;
$$;

create or replace function public.update_custom_subject_if_version(
  p_subject_id uuid,
  p_base_version bigint,
  p_name text,
  p_code text default null,
  p_qualification_label text default null,
  p_description text default null
)
returns public.custom_subjects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.custom_subjects;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.custom_subjects
  set name = p_name,
      code = p_code,
      qualification_label = p_qualification_label,
      description = p_description
  where id = p_subject_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or subject not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_custom_syllabus_node_if_version(
  p_node_id uuid,
  p_base_version bigint,
  p_parent_id uuid,
  p_node_type text,
  p_node_code text,
  p_title text,
  p_description text,
  p_sort_order integer
)
returns public.custom_syllabus_nodes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.custom_syllabus_nodes;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.custom_syllabus_nodes
  set parent_id = p_parent_id,
      node_type = p_node_type,
      node_code = p_node_code,
      title = p_title,
      description = p_description,
      sort_order = p_sort_order
  where id = p_node_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or node not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_custom_component_if_version(
  p_component_id uuid,
  p_base_version bigint,
  p_name text,
  p_paper_code text,
  p_duration_minutes smallint,
  p_total_marks numeric,
  p_weighting_percent numeric,
  p_display_order smallint
)
returns public.custom_components
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.custom_components;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.custom_components
  set name = p_name,
      paper_code = p_paper_code,
      duration_minutes = p_duration_minutes,
      total_marks = p_total_marks,
      weighting_percent = p_weighting_percent,
      display_order = p_display_order
  where id = p_component_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or component not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_weekly_reflection_if_version(
  p_reflection_id uuid,
  p_base_version bigint,
  p_wins text,
  p_challenges text,
  p_next_steps text,
  p_rating smallint
)
returns public.weekly_reflections
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.weekly_reflections;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.weekly_reflections
  set wins = p_wins,
      challenges = p_challenges,
      next_steps = p_next_steps,
      rating = p_rating
  where id = p_reflection_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or reflection not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_chapter_deadline_if_version(
  p_deadline_id uuid,
  p_base_version bigint,
  p_title_override text,
  p_due_at timestamptz,
  p_status text,
  p_reminder_enabled boolean
)
returns public.chapter_deadlines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.chapter_deadlines;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.chapter_deadlines
  set title_override = p_title_override,
      due_at = p_due_at,
      status = p_status,
      reminder_enabled = p_reminder_enabled
  where id = p_deadline_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or deadline not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_calendar_event_if_version(
  p_event_id uuid,
  p_base_version bigint,
  p_title text,
  p_description text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_is_all_day boolean,
  p_timezone text
)
returns public.calendar_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.calendar_events;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.calendar_events
  set title = p_title,
      description = p_description,
      start_at = p_start_at,
      end_at = p_end_at,
      is_all_day = p_is_all_day,
      timezone = p_timezone
  where id = p_event_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or event not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

revoke execute on function public.create_user_subject(uuid, uuid, uuid, text, smallint, uuid)
  from public, anon;
revoke execute on function public.set_user_subject_archived(uuid, boolean, bigint)
  from public, anon;
revoke execute on function public.soft_delete_user_subject(uuid, bigint)
  from public, anon;
revoke execute on function public.change_username(text)
  from public, anon;
revoke execute on function public.mark_notification_read(uuid)
  from public, anon;
revoke execute on function public.acknowledge_milestone(uuid)
  from public, anon;
revoke execute on function public.cancel_ai_job(uuid)
  from public, anon;
revoke execute on function public.review_ai_result(uuid, text)
  from public, anon;
revoke execute on function public.register_push_device(text, text, text, text)
  from public, anon;
revoke execute on function public.revoke_push_device(uuid)
  from public, anon;
revoke execute on function public.set_syllabus_progress(uuid, uuid, uuid, text, bigint, uuid)
  from public, anon;
revoke execute on function public.set_syllabus_note(uuid, uuid, uuid, text, bigint, uuid)
  from public, anon;
revoke execute on function public.update_paper_attempt_if_version(uuid, bigint, numeric, numeric, date, smallint, text)
  from public, anon;
revoke execute on function public.update_custom_subject_if_version(uuid, bigint, text, text, text, text)
  from public, anon;
revoke execute on function public.update_custom_syllabus_node_if_version(uuid, bigint, uuid, text, text, text, text, integer)
  from public, anon;
revoke execute on function public.update_custom_component_if_version(uuid, bigint, text, text, smallint, numeric, numeric, smallint)
  from public, anon;
revoke execute on function public.update_weekly_reflection_if_version(uuid, bigint, text, text, text, smallint)
  from public, anon;
revoke execute on function public.update_chapter_deadline_if_version(uuid, bigint, text, timestamptz, text, boolean)
  from public, anon;
revoke execute on function public.update_calendar_event_if_version(uuid, bigint, text, text, timestamptz, timestamptz, boolean, text)
  from public, anon;

grant execute on function public.create_user_subject(uuid, uuid, uuid, text, smallint, uuid)
  to authenticated;
grant execute on function public.set_user_subject_archived(uuid, boolean, bigint)
  to authenticated;
grant execute on function public.soft_delete_user_subject(uuid, bigint)
  to authenticated;
grant execute on function public.change_username(text)
  to authenticated;
grant execute on function public.mark_notification_read(uuid)
  to authenticated;
grant execute on function public.acknowledge_milestone(uuid)
  to authenticated;
grant execute on function public.cancel_ai_job(uuid)
  to authenticated;
grant execute on function public.review_ai_result(uuid, text)
  to authenticated;
grant execute on function public.register_push_device(text, text, text, text)
  to authenticated;
grant execute on function public.revoke_push_device(uuid)
  to authenticated;
grant execute on function public.set_syllabus_progress(uuid, uuid, uuid, text, bigint, uuid)
  to authenticated;
grant execute on function public.set_syllabus_note(uuid, uuid, uuid, text, bigint, uuid)
  to authenticated;
grant execute on function public.update_paper_attempt_if_version(uuid, bigint, numeric, numeric, date, smallint, text)
  to authenticated;
grant execute on function public.update_custom_subject_if_version(uuid, bigint, text, text, text, text)
  to authenticated;
grant execute on function public.update_custom_syllabus_node_if_version(uuid, bigint, uuid, text, text, text, text, integer)
  to authenticated;
grant execute on function public.update_custom_component_if_version(uuid, bigint, text, text, smallint, numeric, numeric, smallint)
  to authenticated;
grant execute on function public.update_weekly_reflection_if_version(uuid, bigint, text, text, text, smallint)
  to authenticated;
grant execute on function public.update_chapter_deadline_if_version(uuid, bigint, text, timestamptz, text, boolean)
  to authenticated;
grant execute on function public.update_calendar_event_if_version(uuid, bigint, text, text, timestamptz, timestamptz, boolean, text)
  to authenticated;

-- ============================================================
-- 013. INDEXES
-- ============================================================

create index qualifications_exam_board_idx
  on public.qualifications (exam_board_id);

create index catalogue_subjects_qualification_active_name_idx
  on public.catalogue_subjects (qualification_id, is_active, name);

create index syllabuses_subject_idx
  on public.syllabuses (catalogue_subject_id);

create index syllabus_versions_syllabus_status_idx
  on public.syllabus_versions (syllabus_id, status);

create index syllabus_versions_year_range_idx
  on public.syllabus_versions (valid_from_year, valid_to_year);

create index syllabus_nodes_version_parent_order_idx
  on public.syllabus_nodes (syllabus_version_id, parent_id, sort_order);

create index syllabus_nodes_version_type_idx
  on public.syllabus_nodes (syllabus_version_id, node_type);

create unique index syllabus_nodes_version_source_key_unique
  on public.syllabus_nodes (syllabus_version_id, source_key)
  where source_key is not null;

create index syllabus_components_version_order_idx
  on public.syllabus_components (syllabus_version_id, display_order);

create unique index syllabus_components_version_paper_code_unique
  on public.syllabus_components (syllabus_version_id, paper_code)
  where paper_code is not null;

create index custom_subjects_user_active_idx
  on public.custom_subjects (user_id, deleted_at);

create index custom_subjects_user_name_idx
  on public.custom_subjects (user_id, lower(name));

create index user_subjects_user_active_order_idx
  on public.user_subjects (user_id, is_archived, sort_order)
  where deleted_at is null;

create unique index user_subjects_active_catalogue_unique
  on public.user_subjects (user_id, catalogue_subject_id)
  where deleted_at is null and catalogue_subject_id is not null;

create unique index user_subjects_active_custom_unique
  on public.user_subjects (user_id, custom_subject_id)
  where deleted_at is null and custom_subject_id is not null;

create index user_subjects_syllabus_version_idx
  on public.user_subjects (syllabus_version_id);

create index custom_syllabus_nodes_subject_parent_order_idx
  on public.custom_syllabus_nodes (user_subject_id, parent_id, sort_order)
  where deleted_at is null;

create index custom_syllabus_nodes_user_updated_idx
  on public.custom_syllabus_nodes (user_id, updated_at);

create unique index custom_syllabus_nodes_subject_source_key_unique
  on public.custom_syllabus_nodes (user_subject_id, source_key)
  where source_key is not null and deleted_at is null;

create index progress_subject_confidence_idx
  on public.user_syllabus_progress (user_subject_id, confidence_status)
  where deleted_at is null;

create index progress_user_updated_idx
  on public.user_syllabus_progress (user_id, updated_at);

create unique index progress_shared_target_unique
  on public.user_syllabus_progress (user_subject_id, syllabus_node_id)
  where syllabus_node_id is not null and deleted_at is null;

create unique index progress_custom_target_unique
  on public.user_syllabus_progress (user_subject_id, custom_syllabus_node_id)
  where custom_syllabus_node_id is not null and deleted_at is null;

create index notes_subject_updated_idx
  on public.syllabus_notes (user_subject_id, updated_at)
  where deleted_at is null;

create unique index notes_shared_target_unique
  on public.syllabus_notes (user_subject_id, syllabus_node_id)
  where syllabus_node_id is not null and deleted_at is null;

create unique index notes_custom_target_unique
  on public.syllabus_notes (user_subject_id, custom_syllabus_node_id)
  where custom_syllabus_node_id is not null and deleted_at is null;

create index custom_components_subject_order_idx
  on public.custom_components (user_subject_id, display_order)
  where deleted_at is null;

create unique index custom_components_subject_paper_code_unique
  on public.custom_components (user_subject_id, paper_code)
  where paper_code is not null and deleted_at is null;

create index paper_attempts_subject_date_idx
  on public.paper_attempts (user_subject_id, attempt_date desc)
  where deleted_at is null;

create index paper_attempts_user_updated_idx
  on public.paper_attempts (user_id, updated_at);

create index paper_attempts_subject_year_session_idx
  on public.paper_attempts (user_subject_id, paper_year, session);

create unique index weekly_reflections_user_week_unique
  on public.weekly_reflections (user_id, week_start)
  where deleted_at is null;

create unique index activity_events_operation_unique
  on public.activity_events (user_id, source_operation_id)
  where source_operation_id is not null;

create index activity_events_user_occurred_idx
  on public.activity_events (user_id, occurred_at desc);

create index chapter_deadlines_user_due_idx
  on public.chapter_deadlines (user_id, due_at)
  where deleted_at is null and status = 'planned';

create index calendar_events_user_start_idx
  on public.calendar_events (user_id, start_at)
  where deleted_at is null;

create index document_uploads_user_created_idx
  on public.document_uploads (user_id, created_at desc);

create index ai_jobs_user_created_idx
  on public.ai_extraction_jobs (user_id, created_at desc);

create index ai_jobs_status_created_idx
  on public.ai_extraction_jobs (status, created_at);

create index import_runs_user_created_idx
  on public.import_runs (user_id, created_at desc);

create unique index import_runs_completed_source_hash_unique
  on public.import_runs (user_id, source_type, source_hash)
  where source_hash is not null and status = 'completed';

create unique index notifications_user_dedupe_unique
  on public.notifications (user_id, dedupe_key)
  where dedupe_key is not null;

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notification_deliveries_status_retry_idx
  on private.notification_deliveries (status, next_attempt_at);

create index ai_usage_ledger_user_time_idx
  on private.ai_usage_ledger (user_id, occurred_at desc);

create unique index custom_subjects_operation_unique
  on public.custom_subjects (user_id, client_operation_id)
  where client_operation_id is not null;

create unique index user_subjects_operation_unique
  on public.user_subjects (user_id, client_operation_id)
  where client_operation_id is not null;

create unique index custom_syllabus_nodes_operation_unique
  on public.custom_syllabus_nodes (user_id, client_operation_id)
  where client_operation_id is not null;

create unique index progress_operation_unique
  on public.user_syllabus_progress (user_id, client_operation_id)
  where client_operation_id is not null;

create unique index notes_operation_unique
  on public.syllabus_notes (user_id, client_operation_id)
  where client_operation_id is not null;

create unique index custom_components_operation_unique
  on public.custom_components (user_id, client_operation_id)
  where client_operation_id is not null;

create unique index paper_attempts_operation_unique
  on public.paper_attempts (user_id, client_operation_id)
  where client_operation_id is not null;

create unique index weekly_reflections_operation_unique
  on public.weekly_reflections (user_id, client_operation_id)
  where client_operation_id is not null;

create unique index chapter_deadlines_operation_unique
  on public.chapter_deadlines (user_id, client_operation_id)
  where client_operation_id is not null;

create unique index calendar_events_operation_unique
  on public.calendar_events (user_id, client_operation_id)
  where client_operation_id is not null;

-- ============================================================
-- 014. TRIGGERS
-- ============================================================

create trigger exam_boards_set_updated_at
before update on public.exam_boards
for each row execute function public.set_updated_at();

create trigger qualifications_set_updated_at
before update on public.qualifications
for each row execute function public.set_updated_at();

create trigger catalogue_subjects_set_updated_at
before update on public.catalogue_subjects
for each row execute function public.set_updated_at();

create trigger syllabuses_set_updated_at
before update on public.syllabuses
for each row execute function public.set_updated_at();

create trigger syllabus_versions_set_updated_at
before update on public.syllabus_versions
for each row execute function public.set_updated_at();

create trigger syllabus_nodes_set_updated_at
before update on public.syllabus_nodes
for each row execute function public.set_updated_at();

create trigger syllabus_nodes_prevent_cycle
before insert or update of parent_id, syllabus_version_id on public.syllabus_nodes
for each row execute function public.prevent_shared_syllabus_node_cycle();

create trigger syllabus_components_set_updated_at
before update on public.syllabus_components
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger custom_subjects_set_updated_at
before update on public.custom_subjects
for each row execute function public.set_updated_at();

create trigger custom_subjects_bump_version
before update on public.custom_subjects
for each row execute function public.bump_record_version();

create trigger user_subjects_validate_links
before insert or update on public.user_subjects
for each row execute function public.validate_user_subject_links();

create trigger user_subjects_enforce_active_limit
before insert or update of is_archived, deleted_at, user_id on public.user_subjects
for each row execute function public.enforce_active_subject_limit();

create trigger user_subjects_set_updated_at
before update on public.user_subjects
for each row execute function public.set_updated_at();

create trigger user_subjects_bump_version
before update on public.user_subjects
for each row execute function public.bump_record_version();

create trigger custom_syllabus_nodes_set_updated_at
before update on public.custom_syllabus_nodes
for each row execute function public.set_updated_at();

create trigger custom_syllabus_nodes_prevent_cycle
before insert or update of parent_id, user_subject_id, user_id on public.custom_syllabus_nodes
for each row execute function public.prevent_custom_syllabus_node_cycle();

create trigger custom_syllabus_nodes_bump_version
before update on public.custom_syllabus_nodes
for each row execute function public.bump_record_version();

create trigger progress_validate_shared_target
before insert or update on public.user_syllabus_progress
for each row execute function public.validate_shared_syllabus_target();

create trigger progress_set_updated_at
before update on public.user_syllabus_progress
for each row execute function public.set_updated_at();

create trigger progress_bump_version
before update on public.user_syllabus_progress
for each row execute function public.bump_record_version();

create trigger notes_validate_shared_target
before insert or update on public.syllabus_notes
for each row execute function public.validate_shared_syllabus_target();

create trigger notes_set_updated_at
before update on public.syllabus_notes
for each row execute function public.set_updated_at();

create trigger notes_bump_version
before update on public.syllabus_notes
for each row execute function public.bump_record_version();

create trigger custom_components_set_updated_at
before update on public.custom_components
for each row execute function public.set_updated_at();

create trigger custom_components_bump_version
before update on public.custom_components
for each row execute function public.bump_record_version();

create trigger paper_attempts_validate_component
before insert or update on public.paper_attempts
for each row execute function public.validate_shared_component_target();

create trigger paper_attempts_validate_year
before insert or update on public.paper_attempts
for each row execute function public.validate_paper_attempt_year();

create trigger paper_attempts_set_updated_at
before update on public.paper_attempts
for each row execute function public.set_updated_at();

create trigger paper_attempts_bump_version
before update on public.paper_attempts
for each row execute function public.bump_record_version();

create trigger weekly_reflections_set_updated_at
before update on public.weekly_reflections
for each row execute function public.set_updated_at();

create trigger weekly_reflections_bump_version
before update on public.weekly_reflections
for each row execute function public.bump_record_version();

create trigger chapter_deadlines_validate_shared_target
before insert or update on public.chapter_deadlines
for each row execute function public.validate_shared_syllabus_target();

create trigger chapter_deadlines_set_updated_at
before update on public.chapter_deadlines
for each row execute function public.set_updated_at();

create trigger chapter_deadlines_bump_version
before update on public.chapter_deadlines
for each row execute function public.bump_record_version();

create trigger calendar_events_validate_subject_owner
before insert or update of user_subject_id, user_id on public.calendar_events
for each row execute function public.validate_optional_user_subject_owner();

create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

create trigger calendar_events_bump_version
before update on public.calendar_events
for each row execute function public.bump_record_version();

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

create trigger ai_jobs_validate_subject_owner
before insert or update of user_subject_id, user_id on public.ai_extraction_jobs
for each row execute function public.validate_optional_user_subject_owner();

create trigger ai_jobs_set_updated_at
before update on public.ai_extraction_jobs
for each row execute function public.set_updated_at();

create trigger ai_results_set_updated_at
before update on public.ai_extraction_results
for each row execute function public.set_updated_at();

create trigger import_runs_set_updated_at
before update on public.import_runs
for each row execute function public.set_updated_at();

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

create trigger ai_usage_ledger_validate_job_owner
before insert or update of job_id, user_id on private.ai_usage_ledger
for each row execute function public.validate_optional_ai_job_owner();

create trigger notification_deliveries_set_updated_at
before update on private.notification_deliveries
for each row execute function public.set_updated_at();

create trigger push_devices_set_updated_at
before update on private.push_devices
for each row execute function public.set_updated_at();

create trigger external_integrations_set_updated_at
before update on private.external_integrations
for each row execute function public.set_updated_at();

create trigger external_calendar_links_set_updated_at
before update on private.external_calendar_links
for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- 015. ENABLE RLS
-- ============================================================

alter table public.exam_boards enable row level security;
alter table public.qualifications enable row level security;
alter table public.catalogue_subjects enable row level security;
alter table public.syllabuses enable row level security;
alter table public.syllabus_versions enable row level security;
alter table public.syllabus_nodes enable row level security;
alter table public.syllabus_components enable row level security;
alter table public.profiles enable row level security;
alter table public.custom_subjects enable row level security;
alter table public.user_subjects enable row level security;
alter table public.custom_syllabus_nodes enable row level security;
alter table public.user_syllabus_progress enable row level security;
alter table public.syllabus_notes enable row level security;
alter table public.custom_components enable row level security;
alter table public.paper_attempts enable row level security;
alter table public.weekly_reflections enable row level security;
alter table public.activity_events enable row level security;
alter table public.user_milestones enable row level security;
alter table public.chapter_deadlines enable row level security;
alter table public.calendar_events enable row level security;
alter table public.user_preferences enable row level security;
alter table public.document_uploads enable row level security;
alter table public.ai_extraction_jobs enable row level security;
alter table public.ai_extraction_results enable row level security;
alter table public.import_runs enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

alter table private.ai_usage_ledger enable row level security;
alter table private.notification_deliveries enable row level security;
alter table private.push_devices enable row level security;
alter table private.external_integrations enable row level security;
alter table private.external_calendar_links enable row level security;
alter table private.reserved_usernames enable row level security;

-- ============================================================
-- 016. PRIVILEGE BASELINE
-- ============================================================

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
revoke all on all tables in schema private from anon, authenticated;
revoke all on all sequences in schema private from anon, authenticated;
revoke all on all functions in schema private from anon, authenticated;

grant usage on schema public to authenticated;

grant select on
  public.exam_boards,
  public.qualifications,
  public.catalogue_subjects,
  public.syllabuses,
  public.syllabus_versions,
  public.syllabus_nodes,
  public.syllabus_components,
  public.profiles,
  public.custom_subjects,
  public.user_subjects,
  public.custom_syllabus_nodes,
  public.user_syllabus_progress,
  public.syllabus_notes,
  public.custom_components,
  public.paper_attempts,
  public.weekly_reflections,
  public.activity_events,
  public.user_milestones,
  public.chapter_deadlines,
  public.calendar_events,
  public.user_preferences,
  public.document_uploads,
  public.ai_extraction_jobs,
  public.ai_extraction_results,
  public.import_runs,
  public.notifications,
  public.notification_preferences
  to authenticated;

-- Direct inserts are permitted only where owner RLS plus database constraints
-- provide the intended behaviour. user_subjects and controlled-generation
-- tables use protected RPC/backend paths instead.
grant insert on
  public.custom_subjects,
  public.custom_syllabus_nodes,
  public.custom_components,
  public.paper_attempts,
  public.weekly_reflections,
  public.chapter_deadlines,
  public.calendar_events
  to authenticated;

-- Narrow direct updates only for account-level non-sensitive preferences.
grant update (display_name, onboarding_status, onboarding_completed_at)
  on public.profiles to authenticated;
grant update (timezone, locale, week_starts_on, sync_appearance_preferences, ai_processing_consent_at)
  on public.user_preferences to authenticated;
grant update (push_enabled, email_enabled, ai_job_updates, sync_conflicts, migration_updates, quiet_hours_start, quiet_hours_end)
  on public.notification_preferences to authenticated;

-- Versioned study records are updated through compare-and-swap RPCs.
-- Hard deletes are backend/account-deletion operations; user deletion uses
-- controlled soft-delete functions.

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all tables in schema private to service_role;
grant all on all sequences in schema private to service_role;

-- ============================================================
-- 017. SHARED CATALOGUE POLICIES
-- ============================================================

create policy "exam boards are readable when active"
on public.exam_boards for select to authenticated
using (is_active = true);

create policy "qualifications are readable when active"
on public.qualifications for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.exam_boards eb
    where eb.id = exam_board_id and eb.is_active = true
  )
);

create policy "catalogue subjects are readable when active"
on public.catalogue_subjects for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.qualifications q
    join public.exam_boards eb on eb.id = q.exam_board_id
    where q.id = qualification_id
      and q.is_active = true
      and eb.is_active = true
  )
);

create policy "syllabuses are readable when active"
on public.syllabuses for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.catalogue_subjects cs
    where cs.id = catalogue_subject_id and cs.is_active = true
  )
);

create policy "approved syllabus versions are readable"
on public.syllabus_versions for select to authenticated
using (
  status in ('active', 'retired')
  and exists (
    select 1 from public.syllabuses s
    join public.catalogue_subjects cs on cs.id = s.catalogue_subject_id
    where s.id = syllabus_id
      and s.is_active = true
      and cs.is_active = true
  )
);

create policy "approved syllabus nodes are readable"
on public.syllabus_nodes for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.syllabus_versions sv
    where sv.id = syllabus_version_id
      and sv.status in ('active', 'retired')
  )
);

create policy "approved syllabus components are readable"
on public.syllabus_components for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.syllabus_versions sv
    where sv.id = syllabus_version_id
      and sv.status in ('active', 'retired')
  )
);

-- ============================================================
-- 018. OWNER POLICIES
-- ============================================================

create policy "profiles select own"
on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "profiles update own"
on public.profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user preferences select own"
on public.user_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "user preferences update own"
on public.user_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "notification preferences select own"
on public.notification_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "notification preferences update own"
on public.notification_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Owner-readable and owner-insertable tables. Updates occur through protected
-- version-aware functions, so no direct UPDATE or DELETE policy is created.
create policy "custom subjects select own"
on public.custom_subjects for select to authenticated
using ((select auth.uid()) = user_id);
create policy "custom subjects insert own"
on public.custom_subjects for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "user subjects select own"
on public.user_subjects for select to authenticated
using ((select auth.uid()) = user_id);

create policy "custom syllabus nodes select own"
on public.custom_syllabus_nodes for select to authenticated
using ((select auth.uid()) = user_id);
create policy "custom syllabus nodes insert own"
on public.custom_syllabus_nodes for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "syllabus progress select own"
on public.user_syllabus_progress for select to authenticated
using ((select auth.uid()) = user_id);

create policy "syllabus notes select own"
on public.syllabus_notes for select to authenticated
using ((select auth.uid()) = user_id);

create policy "custom components select own"
on public.custom_components for select to authenticated
using ((select auth.uid()) = user_id);
create policy "custom components insert own"
on public.custom_components for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "paper attempts select own"
on public.paper_attempts for select to authenticated
using ((select auth.uid()) = user_id);
create policy "paper attempts insert own"
on public.paper_attempts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "weekly reflections select own"
on public.weekly_reflections for select to authenticated
using ((select auth.uid()) = user_id);
create policy "weekly reflections insert own"
on public.weekly_reflections for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "chapter deadlines select own"
on public.chapter_deadlines for select to authenticated
using ((select auth.uid()) = user_id);
create policy "chapter deadlines insert own"
on public.chapter_deadlines for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "calendar events select own"
on public.calendar_events for select to authenticated
using ((select auth.uid()) = user_id);
create policy "calendar events insert own"
on public.calendar_events for insert to authenticated
with check ((select auth.uid()) = user_id);

-- Controlled-generation and protected-workflow records are read-only to users.
create policy "activity events select own"
on public.activity_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy "milestones select own"
on public.user_milestones for select to authenticated
using ((select auth.uid()) = user_id);

create policy "document uploads select own"
on public.document_uploads for select to authenticated
using ((select auth.uid()) = user_id);

create policy "ai jobs select own"
on public.ai_extraction_jobs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "ai results select own"
on public.ai_extraction_results for select to authenticated
using ((select auth.uid()) = user_id);

create policy "import runs select own"
on public.import_runs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "notifications select own"
on public.notifications for select to authenticated
using ((select auth.uid()) = user_id);

-- ============================================================
-- 019. STORAGE OBJECT POLICIES
-- ============================================================
-- Configure the private bucket named `syllabus-uploads` in supabase/config.toml
-- or through the Storage API. Do not manipulate storage object metadata
-- directly. Object paths use: <user_id>/<upload_id>/<filename>.

create policy "users upload syllabus documents to own path"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'syllabus-uploads'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "users read own syllabus documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'syllabus-uploads'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Deletion is intentionally backend-mediated through the Storage API so the
-- object and document_uploads metadata remain consistent.

-- ============================================================
-- 020. DEFAULT PRIVILEGES
-- ============================================================

alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

alter default privileges in schema private
  revoke all on tables from public, anon, authenticated;

alter default privileges in schema private
  revoke execute on functions from public, anon, authenticated;

commit;

-- END OF REVIEWED DRAFT
-- Required before executable migration use:
-- 1. Split into ordered migrations.
-- 2. Run on a clean local Supabase stack with `supabase db reset`.
-- 3. Add database tests for RLS, race conditions, CAS and Storage.
-- 4. Review generated diff and Supabase advisors.
-- 5. Do not push to a remote project until local validation passes.
