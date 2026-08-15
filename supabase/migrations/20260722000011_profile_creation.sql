-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 011
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

-- ============================================================
-- 011. PROFILE CREATION
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, username, display_name)
  values (
    new.id,
    null,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user()
  from public, anon, authenticated;
