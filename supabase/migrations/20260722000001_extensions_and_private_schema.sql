-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 001
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

-- ============================================================
-- 001. EXTENSIONS AND SCHEMAS
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

create table if not exists private.reserved_usernames (
  username text primary key,
  created_at timestamptz not null default now(),
  constraint reserved_usernames_lowercase check (username = lower(username)),
  constraint reserved_usernames_format check (username ~ '^[a-z0-9._]+$')
);

insert into private.reserved_usernames (username)
values
  ('admin'), ('administrator'), ('api'), ('app'), ('auth'),
  ('help'), ('moderator'), ('root'), ('security'), ('staff'),
  ('studybuddy'), ('support'), ('system')
on conflict do nothing;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to service_role;
