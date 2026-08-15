begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

select is(
  (select count(*)::integer from storage.buckets where id = 'syllabus-uploads'),
  1,
  'syllabus-uploads bucket exists'
);

select ok(
  (select not public from storage.buckets where id = 'syllabus-uploads'),
  'syllabus-uploads bucket is private'
);

select is(
  (select file_size_limit from storage.buckets where id = 'syllabus-uploads'),
  10485760::bigint,
  'syllabus-uploads bucket has a 10 MiB limit'
);

select ok(
  (select allowed_mime_types = array['application/pdf']::text[]
   from storage.buckets where id = 'syllabus-uploads'),
  'syllabus-uploads bucket accepts PDF only'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'users upload syllabus documents to own path',
        'users read own syllabus documents'
      )
  ),
  2,
  'both Storage ownership policies exist'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'users upload syllabus documents to own path'
      and with_check like '%syllabus-uploads%'
      and with_check like '%foldername%'
  ),
  'Storage upload policy scopes uploads to the private bucket and user folder'
);

select ok(
  not has_schema_privilege('authenticated', 'private', 'USAGE'),
  'authenticated users cannot access private integration tables'
);

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  '00000000-0000-0000-0000-000000000333',
  'notify.owner@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now()
),
(
  '00000000-0000-0000-0000-000000000444',
  'notify.other@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now()
);

insert into public.notifications (id, user_id, category, title, body) values
(
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000333',
  'sync',
  'Owner Notification',
  'Visible to owner'
),
(
  '60000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000444',
  'sync',
  'Other Notification',
  'Hidden from owner'
);

insert into public.document_uploads (
  id, user_id, storage_bucket, storage_path,
  original_filename, mime_type, size_bytes
) values
(
  '61000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000333',
  'syllabus-uploads',
  '00000000-0000-0000-0000-000000000333/upload/file.pdf',
  'file.pdf',
  'application/pdf',
  1024
),
(
  '61000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000444',
  'syllabus-uploads',
  '00000000-0000-0000-0000-000000000444/upload/file.pdf',
  'file.pdf',
  'application/pdf',
  1024
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000333","role":"authenticated"}',
  true
);
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000333',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.notifications),
  1,
  'user sees only their own notification'
);

select is(
  (select title from public.notifications),
  'Owner Notification',
  'visible notification belongs to the current user'
);

select is(
  (select count(*)::integer from public.document_uploads),
  1,
  'user sees only their own document metadata'
);

select ok(
  not has_table_privilege('authenticated', 'public.notifications', 'INSERT'),
  'users cannot fabricate notifications'
);

select ok(
  not has_table_privilege('authenticated', 'public.document_uploads', 'INSERT'),
  'document metadata is created by a protected backend workflow'
);

select * from finish();
rollback;
