-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 009
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

-- ============================================================
-- 009. NOTIFICATIONS AND FUTURE INTEGRATIONS
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_payload_object
    check (jsonb_typeof(payload) = 'object'),
  constraint notifications_title_nonempty
    check (char_length(btrim(title)) > 0),
  constraint notifications_body_nonempty
    check (char_length(btrim(body)) > 0),
  constraint notifications_id_user_unique
    unique (id, user_id)
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default false,
  email_enabled boolean not null default false,
  ai_job_updates boolean not null default true,
  sync_conflicts boolean not null default true,
  migration_updates boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null,
  status text not null default 'pending',
  attempt_count smallint not null default 0,
  provider_message_id text,
  last_error_code text,
  next_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_channel_valid
    check (channel in ('push', 'email')),
  constraint notification_deliveries_status_valid
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  constraint notification_deliveries_attempt_nonnegative
    check (attempt_count >= 0),
  constraint notification_deliveries_notification_owner_fk
    foreign key (notification_id, user_id)
    references public.notifications(id, user_id)
    on delete cascade
);

create table private.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  token_hash text not null unique,
  platform text,
  browser_label text,
  device_label text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.external_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null,
  external_account_id text,
  granted_scopes text[] not null default '{}',
  secret_reference text,
  connected_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_integrations_status_valid
    check (status in ('connected', 'expired', 'revoked', 'error')),
  constraint external_integrations_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint external_integrations_id_user_unique
    unique (id, user_id)
);

create table private.external_calendar_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null,
  calendar_event_id uuid not null,
  external_calendar_id text,
  external_event_id text not null,
  sync_status text not null,
  last_synced_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_calendar_links_sync_status_valid
    check (sync_status in ('synced', 'pending', 'conflict', 'error', 'deleted')),
  constraint external_calendar_links_integration_event_unique
    unique (integration_id, calendar_event_id),
  constraint external_calendar_links_external_event_unique
    unique (integration_id, external_event_id),
  constraint external_calendar_links_integration_owner_fk
    foreign key (integration_id, user_id)
    references private.external_integrations(id, user_id)
    on delete cascade,
  constraint external_calendar_links_event_owner_fk
    foreign key (calendar_event_id, user_id)
    references public.calendar_events(id, user_id)
    on delete cascade
);
