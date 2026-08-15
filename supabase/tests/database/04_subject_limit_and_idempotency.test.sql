begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  '00000000-0000-0000-0000-0000000000d4',
  'subject.limit@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now()
),
(
  '00000000-0000-0000-0000-0000000000e5',
  'subject.idempotent@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now()
);

insert into public.custom_subjects (id, user_id, name)
select
  ('10000000-0000-0000-0000-' || lpad(gs::text, 12, '0'))::uuid,
  '00000000-0000-0000-0000-0000000000d4'::uuid,
  'Limit Subject ' || gs
from generate_series(1, 8) gs;

insert into public.custom_subjects (id, user_id, name)
values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000e5',
  'Idempotent Subject'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d4","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000d4',
  true
);
set local role authenticated;

select public.create_user_subject(
  p_custom_subject_id := ('10000000-0000-0000-0000-' || lpad(gs::text, 12, '0'))::uuid
)
from generate_series(1, 7) gs;

select is(
  (select count(*)::integer from public.user_subjects
   where deleted_at is null and is_archived = false),
  7,
  'seven active subjects can be created'
);

select throws_like(
  $$select public.create_user_subject(
      p_custom_subject_id := '10000000-0000-0000-0000-000000000008'
    )$$,
  '%maximum of seven active subjects%',
  'eighth active subject is rejected'
);

select ok(
  not has_table_privilege('authenticated', 'public.user_subjects', 'INSERT'),
  'direct user_subject inserts are not granted to authenticated users'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000e5","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000e5',
  true
);
set local role authenticated;

select public.create_user_subject(
  p_custom_subject_id := '20000000-0000-0000-0000-000000000001',
  p_client_operation_id := '30000000-0000-0000-0000-000000000001'
);

select public.create_user_subject(
  p_custom_subject_id := '20000000-0000-0000-0000-000000000001',
  p_client_operation_id := '30000000-0000-0000-0000-000000000001'
);

select is(
  (select count(*)::integer from public.user_subjects
   where client_operation_id = '30000000-0000-0000-0000-000000000001'),
  1,
  'repeating create_user_subject with the same operation ID is idempotent'
);

select is(
  (select count(distinct id)::integer from public.user_subjects
   where client_operation_id = '30000000-0000-0000-0000-000000000001'),
  1,
  'idempotent retry returns one durable subject row'
);

select ok(
  (select version = 1 from public.user_subjects
   where client_operation_id = '30000000-0000-0000-0000-000000000001'),
  'new subject starts at version 1'
);

select * from finish();
rollback;
