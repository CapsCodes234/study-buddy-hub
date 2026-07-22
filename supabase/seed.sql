-- Study Buddy Hub — deterministic local development seed
-- Data only. This file runs after all schema migrations during local reset.
-- Never include hosted-project secrets or production user data here.

insert into public.exam_boards (id, code, name, website_label, is_active)
values (
  '10000000-0000-4000-8000-000000000001',
  'CAIE',
  'Cambridge Assessment International Education',
  'Cambridge International',
  true
)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  website_label = excluded.website_label,
  is_active = excluded.is_active;

insert into public.qualifications (
  id, exam_board_id, code, name, level_label, is_active
)
values (
  '11000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'A_LEVEL',
  'Cambridge International AS & A Level',
  'AS & A Level',
  true
)
on conflict (id) do update set
  exam_board_id = excluded.exam_board_id,
  code = excluded.code,
  name = excluded.name,
  level_label = excluded.level_label,
  is_active = excluded.is_active;

insert into public.catalogue_subjects (
  id, qualification_id, code, slug, name, description, is_active
)
values
  (
    '12000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '9709', 'mathematics', 'Mathematics',
    'Local development catalogue subject.', true
  ),
  (
    '12000000-0000-4000-8000-000000000002',
    '11000000-0000-4000-8000-000000000001',
    '9702', 'physics', 'Physics',
    'Local development catalogue subject.', true
  ),
  (
    '12000000-0000-4000-8000-000000000003',
    '11000000-0000-4000-8000-000000000001',
    '9626', 'information-technology', 'Information Technology',
    'Local development catalogue subject.', true
  )
on conflict (id) do update set
  qualification_id = excluded.qualification_id,
  code = excluded.code,
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.syllabuses (
  id, catalogue_subject_id, syllabus_code, title, is_active
)
values
  (
    '13000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '9709', 'Mathematics', true
  ),
  (
    '13000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000002',
    '9702', 'Physics', true
  ),
  (
    '13000000-0000-4000-8000-000000000003',
    '12000000-0000-4000-8000-000000000003',
    '9626', 'Information Technology', true
  )
on conflict (id) do update set
  catalogue_subject_id = excluded.catalogue_subject_id,
  syllabus_code = excluded.syllabus_code,
  title = excluded.title,
  is_active = excluded.is_active;

insert into public.syllabus_versions (
  id, syllabus_id, version_label, valid_from_year, valid_to_year,
  status, source_reference, published_at
)
values
  (
    '14000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    'local-dev-2026', 2026, 2027, 'active',
    'Deterministic local development seed', now()
  ),
  (
    '14000000-0000-4000-8000-000000000002',
    '13000000-0000-4000-8000-000000000002',
    'local-dev-2026', 2026, 2027, 'active',
    'Deterministic local development seed', now()
  ),
  (
    '14000000-0000-4000-8000-000000000003',
    '13000000-0000-4000-8000-000000000003',
    'local-dev-2026', 2026, 2027, 'active',
    'Deterministic local development seed', now()
  )
on conflict (id) do update set
  syllabus_id = excluded.syllabus_id,
  version_label = excluded.version_label,
  valid_from_year = excluded.valid_from_year,
  valid_to_year = excluded.valid_to_year,
  status = excluded.status,
  source_reference = excluded.source_reference,
  published_at = excluded.published_at;

insert into public.syllabus_nodes (
  id, syllabus_version_id, parent_id, node_type, node_code,
  title, description, sort_order, source_key, is_active
)
values
  (
    '15000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    null, 'section', 'DEV-MATH-01',
    'Development Mathematics Section',
    'Minimal node used for local database and RLS tests.',
    1, 'local-dev-math-01', true
  ),
  (
    '15000000-0000-4000-8000-000000000002',
    '14000000-0000-4000-8000-000000000002',
    null, 'section', 'DEV-PHYS-01',
    'Development Physics Section',
    'Minimal node used for local database and RLS tests.',
    1, 'local-dev-physics-01', true
  ),
  (
    '15000000-0000-4000-8000-000000000003',
    '14000000-0000-4000-8000-000000000003',
    null, 'section', 'DEV-IT-01',
    'Development Information Technology Section',
    'Minimal node used for local database and RLS tests.',
    1, 'local-dev-it-01', true
  )
on conflict (id) do update set
  syllabus_version_id = excluded.syllabus_version_id,
  parent_id = excluded.parent_id,
  node_type = excluded.node_type,
  node_code = excluded.node_code,
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  source_key = excluded.source_key,
  is_active = excluded.is_active;

insert into public.syllabus_components (
  id, syllabus_version_id, name, paper_code, duration_minutes,
  total_marks, weighting_percent, display_order, is_active
)
values
  (
    '16000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    'Pure Mathematics 3', 'P3', 105, 75, null, 1, true
  ),
  (
    '16000000-0000-4000-8000-000000000002',
    '14000000-0000-4000-8000-000000000002',
    'A Level Structured Questions', 'P4', 120, 100, null, 1, true
  ),
  (
    '16000000-0000-4000-8000-000000000003',
    '14000000-0000-4000-8000-000000000003',
    'Advanced Theory', 'P3', 105, 70, null, 1, true
  )
on conflict (id) do update set
  syllabus_version_id = excluded.syllabus_version_id,
  name = excluded.name,
  paper_code = excluded.paper_code,
  duration_minutes = excluded.duration_minutes,
  total_marks = excluded.total_marks,
  weighting_percent = excluded.weighting_percent,
  display_order = excluded.display_order,
  is_active = excluded.is_active;
