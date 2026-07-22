-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 008
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

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
