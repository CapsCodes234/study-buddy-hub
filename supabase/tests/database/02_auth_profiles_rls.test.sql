begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(9);

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  '00000000-0000-0000-0000-0000000000a1',
  'alpha.profile@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Alpha Student"}'::jsonb,
  now(), now()
),
(
  '00000000-0000-0000-0000-0000000000b2',
  'beta.profile@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Beta Student"}'::jsonb,
  now(), now()
);

select is(
  (select count(*)::integer from public.profiles
   where user_id in (
     '00000000-0000-0000-0000-0000000000a1',
     '00000000-0000-0000-0000-0000000000b2'
   )),
  2,
  'signup trigger creates one profile per auth user'
);

select is(
  (select count(*)::integer from public.user_preferences
   where user_id in (
     '00000000-0000-0000-0000-0000000000a1',
     '00000000-0000-0000-0000-0000000000b2'
   )),
  2,
  'signup trigger creates one user_preferences row per auth user'
);

select is(
  (select count(*)::integer from public.notification_preferences
   where user_id in (
     '00000000-0000-0000-0000-0000000000a1',
     '00000000-0000-0000-0000-0000000000b2'
   )),
  2,
  'signup trigger creates one notification_preferences row per auth user'
);

select is(
  (select display_name from public.profiles
   where user_id = '00000000-0000-0000-0000-0000000000a1'),
  'Alpha Student',
  'profile trigger copies display_name metadata'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-0000000000a1',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.profiles),
  1,
  'authenticated user can see only their own profile'
);

select lives_ok(
  $$update public.profiles
    set display_name = 'Alpha Updated'
    where user_id = '00000000-0000-0000-0000-0000000000a1'$$,
  'authenticated user can update allowed columns on their own profile'
);

select is(
  (select display_name from public.profiles
   where user_id = '00000000-0000-0000-0000-0000000000a1'),
  'Alpha Updated',
  'own profile update is persisted'
);

select lives_ok(
  $$update public.profiles
    set display_name = 'Illegal Cross-User Update'
    where user_id = '00000000-0000-0000-0000-0000000000b2'$$,
  'cross-user profile update is filtered by RLS without error'
);

reset role;

select is(
  (
    select display_name
    from public.profiles
    where user_id = '00000000-0000-0000-0000-0000000000b2'
  ),
  'Beta Student',
  'cross-user profile update does not change the other user row'
);

select * from finish();
rollback;
