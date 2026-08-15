-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 005
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

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
