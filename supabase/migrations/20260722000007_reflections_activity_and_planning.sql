-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 007
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

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
