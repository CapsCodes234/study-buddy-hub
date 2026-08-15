begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(7);

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-0000000000f6',
  'cas.owner@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now()
);

insert into public.custom_subjects (
  id, user_id, name, code, version
) values (
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000f6',
  'Original Name',
  'OLD',
  1
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000f6","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000f6',
  true
);
set local role authenticated;

select lives_ok(
  $$select public.update_custom_subject_if_version(
      '40000000-0000-0000-0000-000000000001',
      1,
      'Updated Name',
      'NEW',
      'A Level',
      'CAS update'
    )$$,
  'CAS update succeeds with the current base version'
);

select is(
  (select name from public.custom_subjects
   where id = '40000000-0000-0000-0000-000000000001'),
  'Updated Name',
  'CAS update changes the row'
);

select is(
  (select version from public.custom_subjects
   where id = '40000000-0000-0000-0000-000000000001'),
  2::bigint,
  'CAS update increments the record version'
);

select throws_like(
  $$select public.update_custom_subject_if_version(
      '40000000-0000-0000-0000-000000000001',
      1,
      'Stale Name',
      null,
      null,
      null
    )$$,
  '%Version conflict%',
  'stale base version is rejected'
);

select lives_ok(
  $$select public.soft_delete_custom_subject(
      '40000000-0000-0000-0000-000000000001',
      2
    )$$,
  'soft delete succeeds with the current version'
);

select ok(
  (select deleted_at is not null from public.custom_subjects
   where id = '40000000-0000-0000-0000-000000000001'),
  'soft delete writes a tombstone'
);

select ok(
  not has_table_privilege('authenticated', 'public.custom_subjects', 'DELETE'),
  'authenticated users have no hard-delete privilege on custom subjects'
);

select * from finish();
rollback;
