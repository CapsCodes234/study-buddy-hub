-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 017, 018
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

-- ============================================================
-- 017. SHARED CATALOGUE POLICIES
-- ============================================================

create policy "exam boards are readable when active"
on public.exam_boards for select to authenticated
using (is_active = true);

create policy "qualifications are readable when active"
on public.qualifications for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.exam_boards eb
    where eb.id = exam_board_id and eb.is_active = true
  )
);

create policy "catalogue subjects are readable when active"
on public.catalogue_subjects for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.qualifications q
    join public.exam_boards eb on eb.id = q.exam_board_id
    where q.id = qualification_id
      and q.is_active = true
      and eb.is_active = true
  )
);

create policy "syllabuses are readable when active"
on public.syllabuses for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.catalogue_subjects cs
    where cs.id = catalogue_subject_id and cs.is_active = true
  )
);

create policy "approved syllabus versions are readable"
on public.syllabus_versions for select to authenticated
using (
  status in ('active', 'retired')
  and exists (
    select 1 from public.syllabuses s
    join public.catalogue_subjects cs on cs.id = s.catalogue_subject_id
    where s.id = syllabus_id
      and s.is_active = true
      and cs.is_active = true
  )
);

create policy "approved syllabus nodes are readable"
on public.syllabus_nodes for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.syllabus_versions sv
    where sv.id = syllabus_version_id
      and sv.status in ('active', 'retired')
  )
);

create policy "approved syllabus components are readable"
on public.syllabus_components for select to authenticated
using (
  is_active = true
  and exists (
    select 1 from public.syllabus_versions sv
    where sv.id = syllabus_version_id
      and sv.status in ('active', 'retired')
  )
);
-- ============================================================
-- 018. OWNER POLICIES
-- ============================================================

create policy "profiles select own"
on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "profiles update own"
on public.profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user preferences select own"
on public.user_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "user preferences update own"
on public.user_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "notification preferences select own"
on public.notification_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "notification preferences update own"
on public.notification_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Owner-readable and owner-insertable tables. Updates occur through protected
-- version-aware functions, so no direct UPDATE or DELETE policy is created.
create policy "custom subjects select own"
on public.custom_subjects for select to authenticated
using ((select auth.uid()) = user_id);
create policy "custom subjects insert own"
on public.custom_subjects for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "user subjects select own"
on public.user_subjects for select to authenticated
using ((select auth.uid()) = user_id);

create policy "custom syllabus nodes select own"
on public.custom_syllabus_nodes for select to authenticated
using ((select auth.uid()) = user_id);
create policy "custom syllabus nodes insert own"
on public.custom_syllabus_nodes for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "syllabus progress select own"
on public.user_syllabus_progress for select to authenticated
using ((select auth.uid()) = user_id);

create policy "syllabus notes select own"
on public.syllabus_notes for select to authenticated
using ((select auth.uid()) = user_id);

create policy "custom components select own"
on public.custom_components for select to authenticated
using ((select auth.uid()) = user_id);
create policy "custom components insert own"
on public.custom_components for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "paper attempts select own"
on public.paper_attempts for select to authenticated
using ((select auth.uid()) = user_id);
create policy "paper attempts insert own"
on public.paper_attempts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "weekly reflections select own"
on public.weekly_reflections for select to authenticated
using ((select auth.uid()) = user_id);
create policy "weekly reflections insert own"
on public.weekly_reflections for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "chapter deadlines select own"
on public.chapter_deadlines for select to authenticated
using ((select auth.uid()) = user_id);
create policy "chapter deadlines insert own"
on public.chapter_deadlines for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "calendar events select own"
on public.calendar_events for select to authenticated
using ((select auth.uid()) = user_id);
create policy "calendar events insert own"
on public.calendar_events for insert to authenticated
with check ((select auth.uid()) = user_id);

-- Controlled-generation and protected-workflow records are read-only to users.
create policy "activity events select own"
on public.activity_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy "milestones select own"
on public.user_milestones for select to authenticated
using ((select auth.uid()) = user_id);

create policy "document uploads select own"
on public.document_uploads for select to authenticated
using ((select auth.uid()) = user_id);

create policy "ai jobs select own"
on public.ai_extraction_jobs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "ai results select own"
on public.ai_extraction_results for select to authenticated
using ((select auth.uid()) = user_id);

create policy "import runs select own"
on public.import_runs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "notifications select own"
on public.notifications for select to authenticated
using ((select auth.uid()) = user_id);
