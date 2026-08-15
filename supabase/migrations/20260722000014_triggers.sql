-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 014
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

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
