-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 004
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

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
