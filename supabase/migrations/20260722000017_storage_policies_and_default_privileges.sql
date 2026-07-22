-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 019, 020
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

-- ============================================================
-- 019. STORAGE OBJECT POLICIES
-- ============================================================
-- Configure the private bucket named `syllabus-uploads` in supabase/config.toml
-- or through the Storage API. Do not manipulate storage object metadata
-- directly. Object paths use: <user_id>/<upload_id>/<filename>.

create policy "users upload syllabus documents to own path"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'syllabus-uploads'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "users read own syllabus documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'syllabus-uploads'
  and owner_id = (select auth.uid()::text)
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Deletion is intentionally backend-mediated through the Storage API so the
-- object and document_uploads metadata remain consistent.
-- Current Supabase Storage uses storage.objects.owner_id for ownership.
-- Confirm the generated local Storage schema during the first clean reset.
--
-- User-requested document deletion is implemented by a protected Edge Function:
--   1. authenticate and verify document_uploads.user_id;
--   2. remove the object through the Supabase Storage API;
--   3. mark document_uploads.status = 'deleted' and set deleted_at;
--   4. return the existing completed result on idempotent retries.
-- Direct deletion of storage.objects metadata is intentionally not exposed.
-- ============================================================
-- 020. DEFAULT PRIVILEGES
-- ============================================================

alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

alter default privileges in schema private
  revoke all on tables from public, anon, authenticated;

alter default privileges in schema private
  revoke execute on functions from public, anon, authenticated;
