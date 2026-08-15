begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

select ok(
  has_function_privilege(
    'authenticated',
    'public.create_user_subject(uuid,uuid,uuid,text,smallint,uuid)',
    'EXECUTE'
  ),
  'authenticated role can execute create_user_subject'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.update_custom_subject_if_version(uuid,bigint,text,text,text,text)',
    'EXECUTE'
  ),
  'authenticated role can execute custom-subject CAS update'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.soft_delete_custom_subject(uuid,bigint)',
    'EXECUTE'
  ),
  'authenticated role can execute custom-subject soft delete'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_user_subject(uuid,uuid,uuid,text,smallint,uuid)',
    'EXECUTE'
  ),
  'anon role cannot execute create_user_subject'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.handle_new_user()',
    'EXECUTE'
  ),
  'authenticated role cannot directly execute signup trigger function'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.enforce_active_subject_limit()',
    'EXECUTE'
  ),
  'authenticated role cannot directly execute subject-limit trigger function'
);

select ok(
  not has_table_privilege('authenticated', 'public.user_subjects', 'INSERT'),
  'authenticated role must create selected subjects through RPC'
);

select ok(
  not has_table_privilege('authenticated', 'public.custom_subjects', 'UPDATE'),
  'authenticated role must update custom subjects through CAS RPC'
);

select ok(
  not has_table_privilege('authenticated', 'public.custom_subjects', 'DELETE'),
  'authenticated role cannot hard-delete custom subjects'
);

select ok(
  has_table_privilege('service_role', 'private.ai_usage_ledger', 'SELECT'),
  'service role can read private AI usage ledger'
);

select ok(
  has_table_privilege('service_role', 'private.push_devices', 'INSERT'),
  'service role can write private push devices'
);

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proconfig is null
  ),
  0,
  'security-definer functions have an explicit configuration/search path'
);

select * from finish();
rollback;
