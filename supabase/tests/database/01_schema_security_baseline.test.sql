begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

select ok(to_regnamespace('public') is not null, 'public schema exists');
select ok(to_regnamespace('private') is not null, 'private schema exists');

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema in ('public', 'private')
      and table_type = 'BASE TABLE'
  ),
  33,
  '33 application tables exist across public and private schemas'
);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  ),
  27,
  '27 public application tables exist'
);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'private'
      and table_type = 'BASE TABLE'
  ),
  6,
  '6 private application tables exist'
);

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'activity_events', 'ai_extraction_jobs', 'ai_extraction_results',
        'calendar_events', 'catalogue_subjects', 'chapter_deadlines',
        'custom_components', 'custom_subjects', 'custom_syllabus_nodes',
        'document_uploads', 'exam_boards', 'import_runs',
        'notification_preferences', 'notifications', 'paper_attempts',
        'profiles', 'qualifications', 'syllabus_components', 'syllabus_nodes',
        'syllabus_notes', 'syllabus_versions', 'syllabuses',
        'user_milestones', 'user_preferences', 'user_subjects',
        'user_syllabus_progress', 'weekly_reflections'
      )
      and not c.relrowsecurity
  ),
  0,
  'RLS is enabled on every public application table'
);

select ok(
  not has_schema_privilege('authenticated', 'private', 'USAGE'),
  'authenticated role cannot use the private schema'
);

select ok(
  not has_schema_privilege('anon', 'private', 'USAGE'),
  'anon role cannot use the private schema'
);

select is(
  (
    select count(*)::integer
    from supabase_migrations.schema_migrations
    where version between '20260722000001' and '20260722000017'
  ),
  17,
  'all 17 Study Buddy Hub migrations are recorded'
);

select ok(
  to_regprocedure('public.create_user_subject(uuid,uuid,uuid,text,smallint,uuid)') is not null,
  'create_user_subject RPC exists'
);

select ok(
  to_regprocedure('public.update_custom_subject_if_version(uuid,bigint,text,text,text,text)') is not null,
  'custom-subject CAS update RPC exists'
);

select ok(
  to_regprocedure('public.soft_delete_custom_subject(uuid,bigint)') is not null,
  'custom-subject soft-delete RPC exists'
);

select * from finish();
rollback;
