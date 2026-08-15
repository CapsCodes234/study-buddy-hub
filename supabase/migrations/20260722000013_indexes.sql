-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 013
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

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
