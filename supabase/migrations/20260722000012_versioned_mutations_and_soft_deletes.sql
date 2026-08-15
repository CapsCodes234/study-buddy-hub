-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 012, 012B
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

-- ============================================================
-- 012. SEVEN-SUBJECT ATOMIC CREATION FUNCTION
-- ============================================================

create or replace function public.create_user_subject(
  p_catalogue_subject_id uuid default null,
  p_custom_subject_id uuid default null,
  p_syllabus_version_id uuid default null,
  p_display_name_override text default null,
  p_sort_order smallint default 0,
  p_client_operation_id uuid default null
)
returns public.user_subjects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.user_subjects;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if (
    (p_catalogue_subject_id is not null)::integer
    + (p_custom_subject_id is not null)::integer
  ) <> 1 then
    raise exception 'Exactly one subject source is required';
  end if;

  if p_client_operation_id is not null then
    select * into v_row
    from public.user_subjects us
    where us.user_id = v_user_id
      and us.client_operation_id = p_client_operation_id;
    if found then
      return v_row;
    end if;
  end if;

  insert into public.user_subjects (
    user_id,
    catalogue_subject_id,
    custom_subject_id,
    syllabus_version_id,
    display_name_override,
    sort_order,
    client_operation_id
  )
  values (
    v_user_id,
    p_catalogue_subject_id,
    p_custom_subject_id,
    p_syllabus_version_id,
    nullif(btrim(p_display_name_override), ''),
    p_sort_order,
    p_client_operation_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.set_user_subject_archived(
  p_subject_id uuid,
  p_archived boolean,
  p_base_version bigint
)
returns public.user_subjects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.user_subjects;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.user_subjects
  set is_archived = p_archived
  where id = p_subject_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or subject not found' using errcode = '40001';
  end if;

  return v_row;
end;
$$;

create or replace function public.soft_delete_user_subject(
  p_subject_id uuid,
  p_base_version bigint
)
returns public.user_subjects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_now timestamptz := now();
  v_row public.user_subjects;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.user_subjects
  set deleted_at = v_now
  where id = p_subject_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or subject not found' using errcode = '40001';
  end if;

  update public.custom_syllabus_nodes
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.user_syllabus_progress
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.syllabus_notes
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.custom_components
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.paper_attempts
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.chapter_deadlines
    set deleted_at = coalesce(deleted_at, v_now)
    where user_subject_id = p_subject_id and user_id = v_user_id;
  update public.calendar_events
    set user_subject_id = null
    where user_subject_id = p_subject_id and user_id = v_user_id;

  return v_row;
end;
$$;

create or replace function public.change_username(p_username text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_username text := lower(btrim(p_username));
  v_row public.profiles;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(v_username) not between 3 and 30
     or v_username !~ '^[a-z0-9._]+$' then
    raise exception 'Username does not meet the required format';
  end if;
  if exists (
    select 1 from private.reserved_usernames r where r.username = v_username
  ) then
    raise exception 'Username is unavailable';
  end if;

  begin
    update public.profiles
    set username = v_username
    where user_id = v_user_id
    returning * into v_row;
  exception when unique_violation then
    raise exception 'Username is unavailable';
  end;

  return v_row;
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns public.notifications
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.notifications;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id and user_id = v_user_id
  returning * into v_row;
  if not found then raise exception 'Notification not found'; end if;
  return v_row;
end;
$$;

create or replace function public.acknowledge_milestone(p_milestone_id uuid)
returns public.user_milestones
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.user_milestones;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.user_milestones
  set acknowledged_at = coalesce(acknowledged_at, now())
  where id = p_milestone_id and user_id = v_user_id
  returning * into v_row;
  if not found then raise exception 'Milestone not found'; end if;
  return v_row;
end;
$$;

create or replace function public.cancel_ai_job(p_job_id uuid)
returns public.ai_extraction_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.ai_extraction_jobs;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.ai_extraction_jobs
  set status = 'cancelled', finished_at = now()
  where id = p_job_id
    and user_id = v_user_id
    and status in ('queued', 'processing')
  returning * into v_row;
  if not found then raise exception 'Job cannot be cancelled'; end if;
  return v_row;
end;
$$;

create or replace function public.review_ai_result(
  p_job_id uuid,
  p_decision text
)
returns public.ai_extraction_results
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.ai_extraction_results;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid review decision';
  end if;

  update public.ai_extraction_results
  set review_status = p_decision,
      approved_at = case when p_decision = 'approved' then now() else null end,
      rejected_at = case when p_decision = 'rejected' then now() else null end
  where job_id = p_job_id
    and user_id = v_user_id
    and review_status = 'pending'
  returning * into v_row;

  if not found then raise exception 'Extraction result not found or already reviewed'; end if;
  return v_row;
end;
$$;

create or replace function public.register_push_device(
  p_token text,
  p_platform text default 'web',
  p_browser_label text default null,
  p_device_label text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_id uuid;
  v_hash text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(btrim(p_token)) < 20 then raise exception 'Invalid device token'; end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  insert into private.push_devices (
    user_id, token, token_hash, platform, browser_label, device_label,
    is_active, last_seen_at, revoked_at
  ) values (
    v_user_id, p_token, v_hash, p_platform, p_browser_label, p_device_label,
    true, now(), null
  )
  on conflict (token_hash) do update
  set user_id = excluded.user_id,
      token = excluded.token,
      platform = excluded.platform,
      browser_label = excluded.browser_label,
      device_label = excluded.device_label,
      is_active = true,
      last_seen_at = now(),
      revoked_at = null
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.revoke_push_device(p_device_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update private.push_devices
  set is_active = false, revoked_at = now()
  where id = p_device_id and user_id = v_user_id and is_active = true;
  return found;
end;
$$;

-- Core compare-and-swap operations for the first offline-capable milestone.
create or replace function public.set_syllabus_progress(
  p_user_subject_id uuid,
  p_syllabus_node_id uuid,
  p_custom_syllabus_node_id uuid,
  p_confidence_status text,
  p_base_version bigint default null,
  p_client_operation_id uuid default null
)
returns public.user_syllabus_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.user_syllabus_progress;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if (
    (p_syllabus_node_id is not null)::integer
    + (p_custom_syllabus_node_id is not null)::integer
  ) <> 1 then
    raise exception 'Exactly one syllabus target is required';
  end if;

  select * into v_row
  from public.user_syllabus_progress usp
  where usp.user_id = v_user_id
    and usp.user_subject_id = p_user_subject_id
    and (
      (p_syllabus_node_id is not null and usp.syllabus_node_id = p_syllabus_node_id)
      or
      (p_custom_syllabus_node_id is not null and usp.custom_syllabus_node_id = p_custom_syllabus_node_id)
    )
    and usp.deleted_at is null
  for update;

  if found then
    if p_base_version is null or v_row.version <> p_base_version then
      raise exception 'Version conflict' using errcode = '40001';
    end if;
    update public.user_syllabus_progress
    set confidence_status = p_confidence_status,
        last_reviewed_at = now()
    where id = v_row.id
    returning * into v_row;
  else
    if p_base_version is not null and p_base_version <> 0 then
      raise exception 'Version conflict' using errcode = '40001';
    end if;
    if p_client_operation_id is not null then
      select * into v_row from public.user_syllabus_progress
      where user_id = v_user_id and client_operation_id = p_client_operation_id;
      if found then return v_row; end if;
    end if;
    insert into public.user_syllabus_progress (
      user_id, user_subject_id, syllabus_node_id, custom_syllabus_node_id,
      confidence_status, last_reviewed_at, client_operation_id
    ) values (
      v_user_id, p_user_subject_id, p_syllabus_node_id,
      p_custom_syllabus_node_id, p_confidence_status, now(), p_client_operation_id
    ) returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.set_syllabus_note(
  p_user_subject_id uuid,
  p_syllabus_node_id uuid,
  p_custom_syllabus_node_id uuid,
  p_content text,
  p_base_version bigint default null,
  p_client_operation_id uuid default null
)
returns public.syllabus_notes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.syllabus_notes;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if (
    (p_syllabus_node_id is not null)::integer
    + (p_custom_syllabus_node_id is not null)::integer
  ) <> 1 then
    raise exception 'Exactly one syllabus target is required';
  end if;

  select * into v_row
  from public.syllabus_notes sn
  where sn.user_id = v_user_id
    and sn.user_subject_id = p_user_subject_id
    and (
      (p_syllabus_node_id is not null and sn.syllabus_node_id = p_syllabus_node_id)
      or
      (p_custom_syllabus_node_id is not null and sn.custom_syllabus_node_id = p_custom_syllabus_node_id)
    )
    and sn.deleted_at is null
  for update;

  if found then
    if p_base_version is null or v_row.version <> p_base_version then
      raise exception 'Version conflict' using errcode = '40001';
    end if;
    update public.syllabus_notes
    set content = p_content
    where id = v_row.id
    returning * into v_row;
  else
    if p_base_version is not null and p_base_version <> 0 then
      raise exception 'Version conflict' using errcode = '40001';
    end if;
    if p_client_operation_id is not null then
      select * into v_row from public.syllabus_notes
      where user_id = v_user_id and client_operation_id = p_client_operation_id;
      if found then return v_row; end if;
    end if;
    insert into public.syllabus_notes (
      user_id, user_subject_id, syllabus_node_id, custom_syllabus_node_id,
      content, client_operation_id
    ) values (
      v_user_id, p_user_subject_id, p_syllabus_node_id,
      p_custom_syllabus_node_id, p_content, p_client_operation_id
    ) returning * into v_row;
  end if;

  return v_row;
end;
$$;

create or replace function public.update_paper_attempt_if_version(
  p_attempt_id uuid,
  p_base_version bigint,
  p_score numeric,
  p_max_marks numeric,
  p_attempt_date date,
  p_duration_minutes smallint default null,
  p_notes text default null
)
returns public.paper_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.paper_attempts;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.paper_attempts
  set score = p_score,
      max_marks = p_max_marks,
      attempt_date = p_attempt_date,
      duration_minutes = p_duration_minutes,
      notes = p_notes
  where id = p_attempt_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or attempt not found' using errcode = '40001';
  end if;
  return v_row;
end;
$$;

create or replace function public.update_custom_subject_if_version(
  p_subject_id uuid,
  p_base_version bigint,
  p_name text,
  p_code text default null,
  p_qualification_label text default null,
  p_description text default null
)
returns public.custom_subjects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.custom_subjects;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.custom_subjects
  set name = p_name,
      code = p_code,
      qualification_label = p_qualification_label,
      description = p_description
  where id = p_subject_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or subject not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_custom_syllabus_node_if_version(
  p_node_id uuid,
  p_base_version bigint,
  p_parent_id uuid,
  p_node_type text,
  p_node_code text,
  p_title text,
  p_description text,
  p_sort_order integer
)
returns public.custom_syllabus_nodes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.custom_syllabus_nodes;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.custom_syllabus_nodes
  set parent_id = p_parent_id,
      node_type = p_node_type,
      node_code = p_node_code,
      title = p_title,
      description = p_description,
      sort_order = p_sort_order
  where id = p_node_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or node not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_custom_component_if_version(
  p_component_id uuid,
  p_base_version bigint,
  p_name text,
  p_paper_code text,
  p_duration_minutes smallint,
  p_total_marks numeric,
  p_weighting_percent numeric,
  p_display_order smallint
)
returns public.custom_components
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.custom_components;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.custom_components
  set name = p_name,
      paper_code = p_paper_code,
      duration_minutes = p_duration_minutes,
      total_marks = p_total_marks,
      weighting_percent = p_weighting_percent,
      display_order = p_display_order
  where id = p_component_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or component not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_weekly_reflection_if_version(
  p_reflection_id uuid,
  p_base_version bigint,
  p_wins text,
  p_challenges text,
  p_next_steps text,
  p_rating smallint
)
returns public.weekly_reflections
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.weekly_reflections;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.weekly_reflections
  set wins = p_wins,
      challenges = p_challenges,
      next_steps = p_next_steps,
      rating = p_rating
  where id = p_reflection_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or reflection not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_chapter_deadline_if_version(
  p_deadline_id uuid,
  p_base_version bigint,
  p_title_override text,
  p_due_at timestamptz,
  p_status text,
  p_reminder_enabled boolean
)
returns public.chapter_deadlines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.chapter_deadlines;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.chapter_deadlines
  set title_override = p_title_override,
      due_at = p_due_at,
      status = p_status,
      reminder_enabled = p_reminder_enabled
  where id = p_deadline_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or deadline not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;

create or replace function public.update_calendar_event_if_version(
  p_event_id uuid,
  p_base_version bigint,
  p_title text,
  p_description text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_is_all_day boolean,
  p_timezone text
)
returns public.calendar_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.calendar_events;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  update public.calendar_events
  set title = p_title,
      description = p_description,
      start_at = p_start_at,
      end_at = p_end_at,
      is_all_day = p_is_all_day,
      timezone = p_timezone
  where id = p_event_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;
  if not found then raise exception 'Version conflict or event not found' using errcode = '40001'; end if;
  return v_row;
end;
$$;
-- ============================================================
-- 012B. VERSION-AWARE SOFT-DELETION FUNCTIONS
-- ============================================================
--
-- These functions provide the user-facing removal paths required by the
-- product while retaining tombstones for cross-device synchronisation.
-- Every function:
--   1. derives the caller from auth.uid();
--   2. checks row ownership;
--   3. requires the current base version;
--   4. sets deleted_at rather than performing a hard delete;
--   5. returns SQLSTATE 40001 for stale or missing rows.
--
-- Deleting a custom syllabus node deletes its complete private subtree and
-- tombstones progress, notes and deadlines attached to that subtree.
-- Deleting a custom component does not delete historical paper attempts;
-- paper-attempt snapshots preserve their historical label and paper code.

create or replace function public.soft_delete_custom_subject(
  p_custom_subject_id uuid,
  p_base_version bigint
)
returns public.custom_subjects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.custom_subjects;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1
    from public.user_subjects us
    where us.user_id = v_user_id
      and us.custom_subject_id = p_custom_subject_id
      and us.deleted_at is null
  ) then
    raise exception 'Remove the selected subject before deleting its custom definition';
  end if;

  update public.custom_subjects
  set deleted_at = now()
  where id = p_custom_subject_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or custom subject not found'
      using errcode = '40001';
  end if;

  return v_row;
end;
$$;

create or replace function public.soft_delete_custom_syllabus_node(
  p_node_id uuid,
  p_base_version bigint
)
returns public.custom_syllabus_nodes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_now timestamptz := now();
  v_node_ids uuid[];
  v_row public.custom_syllabus_nodes;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into v_row
  from public.custom_syllabus_nodes csn
  where csn.id = p_node_id
    and csn.user_id = v_user_id
    and csn.deleted_at is null
    and csn.version = p_base_version
  for update;

  if not found then
    raise exception 'Version conflict or syllabus node not found'
      using errcode = '40001';
  end if;

  with recursive subtree as (
    select csn.id
    from public.custom_syllabus_nodes csn
    where csn.id = p_node_id
      and csn.user_id = v_user_id
      and csn.deleted_at is null

    union all

    select child.id
    from public.custom_syllabus_nodes child
    join subtree parent on child.parent_id = parent.id
    where child.user_id = v_user_id
      and child.deleted_at is null
  )
  select array_agg(id) into v_node_ids from subtree;

  update public.custom_syllabus_nodes
  set deleted_at = v_now
  where user_id = v_user_id
    and id = any(v_node_ids)
    and deleted_at is null;

  update public.user_syllabus_progress
  set deleted_at = v_now
  where user_id = v_user_id
    and custom_syllabus_node_id = any(v_node_ids)
    and deleted_at is null;

  update public.syllabus_notes
  set deleted_at = v_now
  where user_id = v_user_id
    and custom_syllabus_node_id = any(v_node_ids)
    and deleted_at is null;

  update public.chapter_deadlines
  set deleted_at = v_now
  where user_id = v_user_id
    and custom_syllabus_node_id = any(v_node_ids)
    and deleted_at is null;

  select *
    into v_row
  from public.custom_syllabus_nodes
  where id = p_node_id
    and user_id = v_user_id;

  return v_row;
end;
$$;

create or replace function public.soft_delete_syllabus_progress(
  p_progress_id uuid,
  p_base_version bigint
)
returns public.user_syllabus_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.user_syllabus_progress;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.user_syllabus_progress
  set deleted_at = now()
  where id = p_progress_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or progress record not found'
      using errcode = '40001';
  end if;

  return v_row;
end;
$$;

create or replace function public.soft_delete_syllabus_note(
  p_note_id uuid,
  p_base_version bigint
)
returns public.syllabus_notes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.syllabus_notes;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.syllabus_notes
  set deleted_at = now()
  where id = p_note_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or note not found'
      using errcode = '40001';
  end if;

  return v_row;
end;
$$;

create or replace function public.soft_delete_custom_component(
  p_component_id uuid,
  p_base_version bigint
)
returns public.custom_components
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.custom_components;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.custom_components
  set deleted_at = now()
  where id = p_component_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or component not found'
      using errcode = '40001';
  end if;

  return v_row;
end;
$$;

create or replace function public.soft_delete_paper_attempt(
  p_attempt_id uuid,
  p_base_version bigint
)
returns public.paper_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.paper_attempts;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.paper_attempts
  set deleted_at = now()
  where id = p_attempt_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or paper attempt not found'
      using errcode = '40001';
  end if;

  return v_row;
end;
$$;

create or replace function public.soft_delete_weekly_reflection(
  p_reflection_id uuid,
  p_base_version bigint
)
returns public.weekly_reflections
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.weekly_reflections;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.weekly_reflections
  set deleted_at = now()
  where id = p_reflection_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or reflection not found'
      using errcode = '40001';
  end if;

  return v_row;
end;
$$;

create or replace function public.soft_delete_chapter_deadline(
  p_deadline_id uuid,
  p_base_version bigint
)
returns public.chapter_deadlines
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.chapter_deadlines;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.chapter_deadlines
  set deleted_at = now()
  where id = p_deadline_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or deadline not found'
      using errcode = '40001';
  end if;

  return v_row;
end;
$$;

create or replace function public.soft_delete_calendar_event(
  p_event_id uuid,
  p_base_version bigint
)
returns public.calendar_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.calendar_events;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  update public.calendar_events
  set deleted_at = now()
  where id = p_event_id
    and user_id = v_user_id
    and deleted_at is null
    and version = p_base_version
  returning * into v_row;

  if not found then
    raise exception 'Version conflict or calendar event not found'
      using errcode = '40001';
  end if;

  return v_row;
end;
$$;

revoke execute on function public.soft_delete_custom_subject(uuid, bigint)
  from public, anon;
revoke execute on function public.soft_delete_custom_syllabus_node(uuid, bigint)
  from public, anon;
revoke execute on function public.soft_delete_syllabus_progress(uuid, bigint)
  from public, anon;
revoke execute on function public.soft_delete_syllabus_note(uuid, bigint)
  from public, anon;
revoke execute on function public.soft_delete_custom_component(uuid, bigint)
  from public, anon;
revoke execute on function public.soft_delete_paper_attempt(uuid, bigint)
  from public, anon;
revoke execute on function public.soft_delete_weekly_reflection(uuid, bigint)
  from public, anon;
revoke execute on function public.soft_delete_chapter_deadline(uuid, bigint)
  from public, anon;
revoke execute on function public.soft_delete_calendar_event(uuid, bigint)
  from public, anon;
revoke execute on function public.create_user_subject(uuid, uuid, uuid, text, smallint, uuid)
  from public, anon;
revoke execute on function public.set_user_subject_archived(uuid, boolean, bigint)
  from public, anon;
revoke execute on function public.soft_delete_user_subject(uuid, bigint)
  from public, anon;
revoke execute on function public.change_username(text)
  from public, anon;
revoke execute on function public.mark_notification_read(uuid)
  from public, anon;
revoke execute on function public.acknowledge_milestone(uuid)
  from public, anon;
revoke execute on function public.cancel_ai_job(uuid)
  from public, anon;
revoke execute on function public.review_ai_result(uuid, text)
  from public, anon;
revoke execute on function public.register_push_device(text, text, text, text)
  from public, anon;
revoke execute on function public.revoke_push_device(uuid)
  from public, anon;
revoke execute on function public.set_syllabus_progress(uuid, uuid, uuid, text, bigint, uuid)
  from public, anon;
revoke execute on function public.set_syllabus_note(uuid, uuid, uuid, text, bigint, uuid)
  from public, anon;
revoke execute on function public.update_paper_attempt_if_version(uuid, bigint, numeric, numeric, date, smallint, text)
  from public, anon;
revoke execute on function public.update_custom_subject_if_version(uuid, bigint, text, text, text, text)
  from public, anon;
revoke execute on function public.update_custom_syllabus_node_if_version(uuid, bigint, uuid, text, text, text, text, integer)
  from public, anon;
revoke execute on function public.update_custom_component_if_version(uuid, bigint, text, text, smallint, numeric, numeric, smallint)
  from public, anon;
revoke execute on function public.update_weekly_reflection_if_version(uuid, bigint, text, text, text, smallint)
  from public, anon;
revoke execute on function public.update_chapter_deadline_if_version(uuid, bigint, text, timestamptz, text, boolean)
  from public, anon;
revoke execute on function public.update_calendar_event_if_version(uuid, bigint, text, text, timestamptz, timestamptz, boolean, text)
  from public, anon;

grant execute on function public.soft_delete_custom_subject(uuid, bigint)
  to authenticated;
grant execute on function public.soft_delete_custom_syllabus_node(uuid, bigint)
  to authenticated;
grant execute on function public.soft_delete_syllabus_progress(uuid, bigint)
  to authenticated;
grant execute on function public.soft_delete_syllabus_note(uuid, bigint)
  to authenticated;
grant execute on function public.soft_delete_custom_component(uuid, bigint)
  to authenticated;
grant execute on function public.soft_delete_paper_attempt(uuid, bigint)
  to authenticated;
grant execute on function public.soft_delete_weekly_reflection(uuid, bigint)
  to authenticated;
grant execute on function public.soft_delete_chapter_deadline(uuid, bigint)
  to authenticated;
grant execute on function public.soft_delete_calendar_event(uuid, bigint)
  to authenticated;
grant execute on function public.create_user_subject(uuid, uuid, uuid, text, smallint, uuid)
  to authenticated;
grant execute on function public.set_user_subject_archived(uuid, boolean, bigint)
  to authenticated;
grant execute on function public.soft_delete_user_subject(uuid, bigint)
  to authenticated;
grant execute on function public.change_username(text)
  to authenticated;
grant execute on function public.mark_notification_read(uuid)
  to authenticated;
grant execute on function public.acknowledge_milestone(uuid)
  to authenticated;
grant execute on function public.cancel_ai_job(uuid)
  to authenticated;
grant execute on function public.review_ai_result(uuid, text)
  to authenticated;
grant execute on function public.register_push_device(text, text, text, text)
  to authenticated;
grant execute on function public.revoke_push_device(uuid)
  to authenticated;
grant execute on function public.set_syllabus_progress(uuid, uuid, uuid, text, bigint, uuid)
  to authenticated;
grant execute on function public.set_syllabus_note(uuid, uuid, uuid, text, bigint, uuid)
  to authenticated;
grant execute on function public.update_paper_attempt_if_version(uuid, bigint, numeric, numeric, date, smallint, text)
  to authenticated;
grant execute on function public.update_custom_subject_if_version(uuid, bigint, text, text, text, text)
  to authenticated;
grant execute on function public.update_custom_syllabus_node_if_version(uuid, bigint, uuid, text, text, text, text, integer)
  to authenticated;
grant execute on function public.update_custom_component_if_version(uuid, bigint, text, text, smallint, numeric, numeric, smallint)
  to authenticated;
grant execute on function public.update_weekly_reflection_if_version(uuid, bigint, text, text, text, smallint)
  to authenticated;
grant execute on function public.update_chapter_deadline_if_version(uuid, bigint, text, timestamptz, text, boolean)
  to authenticated;
grant execute on function public.update_calendar_event_if_version(uuid, bigint, text, text, timestamptz, timestamptz, boolean, text)
  to authenticated;
