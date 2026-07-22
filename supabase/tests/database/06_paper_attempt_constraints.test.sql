begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(7);

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  '00000000-0000-0000-0000-000000000111',
  'paper.owner@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now()
),
(
  '00000000-0000-0000-0000-000000000222',
  'paper.other@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now()
);

insert into public.custom_subjects (id, user_id, name) values
(
  '50000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000111',
  'Owner Subject'
),
(
  '50000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000222',
  'Other Subject'
);

insert into public.user_subjects (id, user_id, custom_subject_id) values
(
  '51000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000111',
  '50000000-0000-0000-0000-000000000001'
),
(
  '51000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000222',
  '50000000-0000-0000-0000-000000000002'
);

insert into public.custom_components (
  id, user_id, user_subject_id, name, paper_code
) values
(
  '52000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000111',
  '51000000-0000-0000-0000-000000000001',
  'Owner Paper',
  'P1'
),
(
  '52000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000222',
  '51000000-0000-0000-0000-000000000002',
  'Other Paper',
  'P2'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000111","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000111',
  true
);
set local role authenticated;

select lives_ok(
  $$insert into public.paper_attempts (
      id, user_id, user_subject_id, custom_component_id,
      paper_year, session, score, max_marks
    ) values (
      '53000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000111',
      '51000000-0000-0000-0000-000000000001',
      '52000000-0000-0000-0000-000000000001',
      2025, 'may_jun', 75, 100
    )$$,
  'owner can insert a valid paper attempt'
);

select is(
  (select percentage from public.paper_attempts
   where id = '53000000-0000-0000-0000-000000000001'),
  75.00::numeric,
  'percentage is generated correctly'
);

select throws_like(
  $$insert into public.paper_attempts (
      user_id, user_subject_id, score, max_marks
    ) values (
      '00000000-0000-0000-0000-000000000111',
      '51000000-0000-0000-0000-000000000001',
      101, 100
    )$$,
  '%paper_attempts_score_valid%',
  'score greater than max_marks is rejected'
);

select throws_like(
  $$insert into public.paper_attempts (
      user_id, user_subject_id, paper_year, score, max_marks
    ) values (
      '00000000-0000-0000-0000-000000000111',
      '51000000-0000-0000-0000-000000000001',
      (extract(year from current_date)::smallint + 1),
      50, 100
    )$$,
  '%paper_year cannot be in the future%',
  'future paper year is rejected'
);

select throws_like(
  $$insert into public.paper_attempts (
      user_id, user_subject_id, custom_component_id, score, max_marks
    ) values (
      '00000000-0000-0000-0000-000000000111',
      '51000000-0000-0000-0000-000000000001',
      '52000000-0000-0000-0000-000000000002',
      50, 100
    )$$,
  '%paper_attempts_custom_component_owner_fk%',
  'component owned by another user is rejected'
);

select is(
  (select count(*)::integer from public.paper_attempts),
  1,
  'failed inserts leave only the valid paper attempt'
);

select ok(
  not has_table_privilege('authenticated', 'public.paper_attempts', 'UPDATE'),
  'paper attempts are updated only through CAS RPCs'
);

select * from finish();
rollback;
