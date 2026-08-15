-- Study Buddy Hub — local Supabase migration
-- Generated from STUDY_BUDDY_HUB_STAGE_3_DATABASE_SQL_DRAFT_3_REVIEWED.sql
-- Preserved reviewed sections: 010
-- Validation status: artifact split only; run `npx supabase db reset` locally before approval.

-- ============================================================
-- 010. CROSS-TABLE VALIDATION FUNCTIONS
-- ============================================================

create or replace function public.validate_user_subject_links()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_catalogue_subject_id uuid;
begin
  if new.catalogue_subject_id is not null then
    if new.syllabus_version_id is null then
      return new;
    end if;

    select s.catalogue_subject_id
      into v_catalogue_subject_id
      from public.syllabus_versions sv
      join public.syllabuses s on s.id = sv.syllabus_id
      where sv.id = new.syllabus_version_id;

    if v_catalogue_subject_id is distinct from new.catalogue_subject_id then
      raise exception 'Selected syllabus version does not belong to selected catalogue subject';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.validate_shared_syllabus_target()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_selected_version uuid;
  v_node_version uuid;
begin
  if new.syllabus_node_id is null then
    return new;
  end if;

  select us.syllabus_version_id
    into v_selected_version
    from public.user_subjects us
    where us.id = new.user_subject_id
      and us.user_id = new.user_id
      and us.deleted_at is null;

  select sn.syllabus_version_id
    into v_node_version
    from public.syllabus_nodes sn
    where sn.id = new.syllabus_node_id;

  if v_selected_version is null
     or v_node_version is distinct from v_selected_version then
    raise exception 'Syllabus node does not belong to the selected syllabus version';
  end if;

  return new;
end;
$$;

create or replace function public.validate_shared_component_target()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_selected_version uuid;
  v_component_version uuid;
begin
  if new.syllabus_component_id is null then
    return new;
  end if;

  select us.syllabus_version_id
    into v_selected_version
    from public.user_subjects us
    where us.id = new.user_subject_id
      and us.user_id = new.user_id
      and us.deleted_at is null;

  select sc.syllabus_version_id
    into v_component_version
    from public.syllabus_components sc
    where sc.id = new.syllabus_component_id;

  if v_selected_version is null
     or v_component_version is distinct from v_selected_version then
    raise exception 'Component does not belong to the selected syllabus version';
  end if;

  return new;
end;
$$;

revoke execute on function public.validate_user_subject_links()
  from public, anon, authenticated;
revoke execute on function public.validate_shared_syllabus_target()
  from public, anon, authenticated;
revoke execute on function public.validate_shared_component_target()
  from public, anon, authenticated;

-- Validate optional subject references where ON DELETE SET NULL must preserve user_id.
create or replace function public.validate_optional_user_subject_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.user_subject_id is not null and not exists (
    select 1
    from public.user_subjects us
    where us.id = new.user_subject_id
      and us.user_id = new.user_id
      and us.deleted_at is null
  ) then
    raise exception 'Referenced user subject does not belong to the current owner';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_shared_syllabus_node_cycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A syllabus node cannot be its own parent';
  end if;

  if exists (
    with recursive ancestors as (
      select sn.id, sn.parent_id
      from public.syllabus_nodes sn
      where sn.id = new.parent_id
        and sn.syllabus_version_id = new.syllabus_version_id
      union all
      select parent.id, parent.parent_id
      from public.syllabus_nodes parent
      join ancestors a on a.parent_id = parent.id
      where parent.syllabus_version_id = new.syllabus_version_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'Syllabus node hierarchy cannot contain a cycle';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_custom_syllabus_node_cycle()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A custom syllabus node cannot be its own parent';
  end if;

  if exists (
    with recursive ancestors as (
      select csn.id, csn.parent_id
      from public.custom_syllabus_nodes csn
      where csn.id = new.parent_id
        and csn.user_subject_id = new.user_subject_id
        and csn.user_id = new.user_id
      union all
      select parent.id, parent.parent_id
      from public.custom_syllabus_nodes parent
      join ancestors a on a.parent_id = parent.id
      where parent.user_subject_id = new.user_subject_id
        and parent.user_id = new.user_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'Custom syllabus hierarchy cannot contain a cycle';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_active_subject_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if new.deleted_at is not null or new.is_archived = true then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select count(*)
  into v_count
  from public.user_subjects us
  where us.user_id = new.user_id
    and us.deleted_at is null
    and us.is_archived = false
    and us.id <> new.id;

  if v_count >= 7 then
    raise exception 'A maximum of seven active subjects is allowed';
  end if;

  return new;
end;
$$;

revoke execute on function public.validate_optional_user_subject_owner()
  from public, anon, authenticated;
revoke execute on function public.prevent_shared_syllabus_node_cycle()
  from public, anon, authenticated;
revoke execute on function public.prevent_custom_syllabus_node_cycle()
  from public, anon, authenticated;
revoke execute on function public.enforce_active_subject_limit()
  from public, anon, authenticated;

create or replace function public.validate_optional_ai_job_owner()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.job_id is not null and not exists (
    select 1
    from public.ai_extraction_jobs job
    where job.id = new.job_id
      and job.user_id = new.user_id
  ) then
    raise exception 'Referenced AI job does not belong to the ledger owner';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_optional_ai_job_owner()
  from public, anon, authenticated;
