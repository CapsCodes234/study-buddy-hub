-- Study Buddy Hub — Stage 3 Database SQL Draft 1
-- Status: REVIEW DRAFT ONLY. DO NOT APPLY TO PRODUCTION.
-- Target: Supabase PostgreSQL
-- Parent specification:
-- docs/STUDY_BUDDY_HUB_STAGE_3_DATABASE_SCHEMA_DRAFT_2_APPROVED.md
--
-- This draft establishes tables, constraints, indexes and helper functions.
-- RLS policies are specified separately in:
-- docs/STUDY_BUDDY_HUB_STAGE_3_RLS_POLICY_MATRIX_DRAFT_1.md
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
  parent_id uuid references public.syllabus_nodes(id) on delete cascade,
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
    check (sort_order >= 0)
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
  username text not null,
  display_name text,
  onboarding_status text not null default 'not_started',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length
    check (char_length(username) between 3 and 30),
  constraint profiles_username_format
    check (username ~ '^[A-Za-z0-9._]+$'),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) <= 80),
  constraint profiles_onboarding_status_valid
    check (onboarding_status in ('not_started', 'in_progress', 'completed'))
);

create unique index profiles_username_lower_unique
  on public.profiles (lower(username));

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
  constraint calendar_events_subject_owner_fk
    foreign key (user_subject_id, user_id)
    references public.user_subjects(id, user_id)
    on delete set null,
  constraint calendar_events_type_valid
    check (event_type in ('exam', 'deadline', 'study', 'other')),
  constraint calendar_events_time_valid
    check (end_at is null or end_at >= start_at),
  constraint calendar_events_title_nonempty
    check (char_length(btrim(title)) > 0)
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
  document_upload_id uuid not null
    references public.document_uploads(id) on delete cascade,
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
  constraint ai_extraction_jobs_subject_owner_fk
    foreign key (user_subject_id, user_id)
    references public.user_subjects(id, user_id)
    on delete set null,
  constraint ai_extraction_jobs_attempt_nonnegative
    check (attempt_count >= 0),
  constraint ai_extraction_jobs_status_valid
    check (
      status in (
        'queued', 'processing', 'review_required',
        'completed', 'failed', 'cancelled'
      )
    )
);

create table public.ai_extraction_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null unique
    references public.ai_extraction_jobs(id) on delete cascade,
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
    check (topic_count >= 0 and component_count >= 0)
);

create table private.ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.ai_extraction_jobs(id) on delete set null,
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
    check (estimated_cost_usd is null or estimated_cost_usd >= 0)
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
    check (char_length(btrim(body)) > 0)
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
  notification_id uuid not null
    references public.notifications(id) on delete cascade,
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
    check (attempt_count >= 0)
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
    check (jsonb_typeof(metadata) = 'object')
);

create table private.external_calendar_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null
    references private.external_integrations(id) on delete cascade,
  calendar_event_id uuid not null
    references public.calendar_events(id) on delete cascade,
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
    unique (integration_id, external_event_id)
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

-- ============================================================
-- 011. PROFILE CREATION
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
begin
  v_username := nullif(btrim(new.raw_user_meta_data ->> 'username'), '');

  -- A temporary deterministic placeholder is used only when registration
  -- has not yet supplied an approved username. The onboarding flow must
  -- require replacement before normal app use.
  if v_username is null then
    v_username := 'user_' || replace(left(new.id::text, 12), '-', '');
  end if;

  insert into public.profiles (user_id, username, display_name)
  values (
    new.id,
    v_username,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '')
  );

  insert into public.user_preferences (user_id)
  values (new.id);

  insert into public.notification_preferences (user_id)
  values (new.id);

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
  p_sort_order smallint default 0
)
returns public.user_subjects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_count integer;
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

  -- Serialise subject-count changes for this user.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text, 0)
  );

  select count(*)
    into v_count
    from public.user_subjects us
    where us.user_id = v_user_id
      and us.deleted_at is null
      and us.is_archived = false;

  if v_count >= 7 then
    raise exception 'A maximum of seven active subjects is allowed';
  end if;

  insert into public.user_subjects (
    user_id,
    catalogue_subject_id,
    custom_subject_id,
    syllabus_version_id,
    display_name_override,
    sort_order
  )
  values (
    v_user_id,
    p_catalogue_subject_id,
    p_custom_subject_id,
    p_syllabus_version_id,
    nullif(btrim(p_display_name_override), ''),
    p_sort_order
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.create_user_subject(
  uuid, uuid, uuid, text, smallint
) from public, anon;
grant execute on function public.create_user_subject(
  uuid, uuid, uuid, text, smallint
) to authenticated;

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

create trigger user_subjects_set_updated_at
before update on public.user_subjects
for each row execute function public.set_updated_at();

create trigger user_subjects_bump_version
before update on public.user_subjects
for each row execute function public.bump_record_version();

create trigger custom_syllabus_nodes_set_updated_at
before update on public.custom_syllabus_nodes
for each row execute function public.set_updated_at();

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

create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

create trigger calendar_events_bump_version
before update on public.calendar_events
for each row execute function public.bump_record_version();

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

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

-- Private schema is not exposed to the Data API. RLS can still be enabled
-- as defence in depth where direct database roles may query it.
alter table private.ai_usage_ledger enable row level security;
alter table private.notification_deliveries enable row level security;
alter table private.push_devices enable row level security;
alter table private.external_integrations enable row level security;
alter table private.external_calendar_links enable row level security;

-- ============================================================
-- 016. GRANTS BASELINE
-- Policies are defined in the separate RLS draft.
-- ============================================================

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant usage on schema public to authenticated;

grant select on
  public.exam_boards,
  public.qualifications,
  public.catalogue_subjects,
  public.syllabuses,
  public.syllabus_versions,
  public.syllabus_nodes,
  public.syllabus_components
to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.custom_subjects,
  public.user_subjects,
  public.custom_syllabus_nodes,
  public.user_syllabus_progress,
  public.syllabus_notes,
  public.custom_components,
  public.paper_attempts,
  public.weekly_reflections,
  public.chapter_deadlines,
  public.calendar_events,
  public.user_preferences,
  public.document_uploads,
  public.import_runs,
  public.notification_preferences
to authenticated;

-- Restricted client mutation tables.
grant select on
  public.activity_events,
  public.user_milestones,
  public.ai_extraction_jobs,
  public.ai_extraction_results,
  public.notifications
to authenticated;

-- User-controlled acknowledgement/review fields require protected RPCs or
-- tightly scoped policies/functions before UPDATE is granted.
-- Do not grant broad UPDATE here.

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all tables in schema private to service_role;
grant all on all sequences in schema private to service_role;

-- ============================================================
-- 017. DEFAULT PRIVILEGES
-- Review the migration owner role in the local Supabase environment.
-- ============================================================

alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

alter default privileges in schema private
  revoke all on tables from public, anon, authenticated;

alter default privileges in schema private
  revoke execute on functions from public, anon, authenticated;

commit;

-- END OF DRAFT
-- Next:
-- 1. Apply only to a disposable local Supabase database.
-- 2. Add RLS policies from the reviewed RLS draft.
-- 3. Run schema, policy and ownership tests.
-- 4. Split this file into ordered migrations after review.
