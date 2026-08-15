-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 003
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

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
