-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 006
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

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
