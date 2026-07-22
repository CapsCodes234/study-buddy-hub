-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 002
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

-- ============================================================
-- 002. COMMON HELPER FUNCTIONS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.bump_record_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new is distinct from old then
    new.version = old.version + 1;
  end if;
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.bump_record_version() from public, anon, authenticated;
