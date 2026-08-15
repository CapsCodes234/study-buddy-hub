begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(8);

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-0000000000c3',
  'catalogue.reader@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now()
);

insert into public.syllabus_versions (
  syllabus_id, version_label, valid_from_year, valid_to_year, status
)
select id, 'TEST-DRAFT-HIDDEN', 2026, 2027, 'draft'
from public.syllabuses
order by created_at
limit 1;

select ok(
  has_table_privilege('authenticated', 'public.exam_boards', 'SELECT'),
  'authenticated role has catalogue SELECT privilege'
);

select ok(
  not has_table_privilege('authenticated', 'public.exam_boards', 'INSERT'),
  'authenticated role cannot insert shared catalogue rows'
);

select ok(
  not has_table_privilege('anon', 'public.exam_boards', 'SELECT'),
  'anon role has no shared catalogue SELECT privilege'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000c3',
  true
);
set local role authenticated;

select is((select count(*)::integer from public.exam_boards), 1,
          'authenticated user can read the active exam board');
select is((select count(*)::integer from public.catalogue_subjects), 3,
          'authenticated user can read three seeded catalogue subjects');
select is((select count(*)::integer from public.syllabuses), 3,
          'authenticated user can read three seeded syllabuses');
select is((select count(*)::integer from public.syllabus_versions), 3,
          'draft syllabus version is hidden by RLS');
select is((select count(*)::integer from public.syllabus_nodes), 3,
          'authenticated user can read seeded syllabus nodes');

select * from finish();
rollback;
