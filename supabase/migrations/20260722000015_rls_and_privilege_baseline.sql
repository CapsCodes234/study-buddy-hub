-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 015, 016
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

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
