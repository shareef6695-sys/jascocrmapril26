-- =============================================================================
-- JASCO CRM — Demo Seed Data
-- Market: Saudi Arabia | Currency: SAR (Saudi Riyal ﷼)
-- Current date context: 2026-05-01
-- =============================================================================
--
-- Demo Credentials  (password for ALL users: Demo@2026!)
-- ---------------------------------------------------------------
--  Role        | Email                       | Company
-- ---------------------------------------------------------------
--  admin       | mmshareef@aljazera.com      | Imdadat Al Jazera
--  director    | nader@ajazera.com           | Imdadat Al Jazera (CEO, all companies)
--  manager     | m.kamal@jascopvc.com        | Jasco PVC
--  supervisor  | osman@jascopvc.com          | Jasco PVC
--  staff       | amer@jascopvc.com           | Jasco PVC
--  staff       | hazem@jascopvc.com          | Jasco PVC
-- ---------------------------------------------------------------
-- Companies created:
--   1. Imdadat Al Jazera  (parent / holding — CEO & Admin users)
--   2. Jasco PVC          (operating — all demo sales data lives here)
--   3. JASCO Steels       (operating — created, no users yet)
-- ---------------------------------------------------------------
-- Run with postgres / service_role access (Supabase SQL Editor).
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 · AUTH USERS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user
) VALUES
  (
    'u0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
    'mmshareef@aljazera.com',
    crypt('Demo@2026!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"full_name":"MM Shareef"}',
    now(), now(), false
  ),
  (
    'u0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
    'nader@ajazera.com',
    crypt('Demo@2026!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nader"}',
    now(), now(), false
  ),
  (
    'u0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
    'm.kamal@jascopvc.com',
    crypt('Demo@2026!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mohamed Kamal"}',
    now(), now(), false
  ),
  (
    'u0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
    'osman@jascopvc.com',
    crypt('Demo@2026!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Osman"}',
    now(), now(), false
  ),
  (
    'u0000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
    'amer@jascopvc.com',
    crypt('Demo@2026!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amer"}',
    now(), now(), false
  ),
  (
    'u0000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated',
    'hazem@jascopvc.com',
    crypt('Demo@2026!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hazem"}',
    now(), now(), false
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 · COMPANIES  (3 companies)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.companies (
  id, name, description, industry,
  country, state, city, address, postal_code,
  phone, email, website,
  currency_code, fiscal_year_start, is_active
) VALUES
  -- Parent / Holding
  (
    'c0000000-0000-0000-0000-000000000001',
    'Imdadat Al Jazera',
    'Parent holding company overseeing Jasco PVC, JASCO Steels, and related industrial subsidiaries.',
    'Holding Company',
    'Saudi Arabia', 'Riyadh Province', 'Riyadh',
    'King Fahd Road, Al Olaya District, Tower A',
    '12211',
    '+966 11 200 0100',
    'info@aljazera.com',
    NULL,
    'SAR', 1, true
  ),
  -- Operating — PVC
  (
    'c0000000-0000-0000-0000-000000000002',
    'Jasco PVC',
    'Supplier of CPVC compounds, PVC fittings, and specialty polymer products to the Saudi industrial market.',
    'Manufacturing & Industrial Supply',
    'Saudi Arabia', 'Riyadh Province', 'Riyadh',
    'King Fahd Road, Al Olaya District, Building 47',
    '12211',
    '+966 11 234 5678',
    'sales@jascopvc.com',
    'https://www.jascopvc.com',
    'SAR', 1, true
  ),
  -- Operating — Steel
  (
    'c0000000-0000-0000-0000-000000000003',
    'JASCO Steels',
    'Supplier of cold-rolled slitted steel coils, full-width coils, and GI products to Saudi manufacturers.',
    'Steel & Metal Products',
    'Saudi Arabia', 'Eastern Province', 'Jubail',
    'King Abdulaziz Industrial City, Jubail Industrial',
    '31961',
    '+966 13 345 6789',
    'sales@jascosteels.com',
    NULL,
    'SAR', 1, true
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 · PUBLIC USERS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.users (
  id, email, first_name, last_name,
  phone, company_id, role, department, job_title,
  manager_id, supervisor_id, territory,
  hire_date, is_active
) VALUES
  -- Admin (Imdadat Al Jazera)
  (
    'u0000000-0000-0000-0000-000000000001',
    'mmshareef@aljazera.com',
    'MM', 'Shareef',
    '+966 55 000 0001',
    'c0000000-0000-0000-0000-000000000001',
    'admin', 'Management', 'CRM Administrator',
    NULL, NULL, 'All Regions',
    '2020-01-01', true
  ),
  -- CEO / Director (Imdadat Al Jazera — cross-company oversight)
  (
    'u0000000-0000-0000-0000-000000000002',
    'nader@ajazera.com',
    'Nader', NULL,
    '+966 55 000 0002',
    'c0000000-0000-0000-0000-000000000001',
    'director', 'Executive', 'CEO',
    'u0000000-0000-0000-0000-000000000001', NULL, 'All Companies',
    '2019-06-01', true
  ),
  -- Sales Manager (Jasco PVC)
  (
    'u0000000-0000-0000-0000-000000000003',
    'm.kamal@jascopvc.com',
    'Mohamed', 'Kamal',
    '+966 55 000 0003',
    'c0000000-0000-0000-0000-000000000002',
    'manager', 'Sales', 'Sales Manager',
    'u0000000-0000-0000-0000-000000000002', NULL, 'Riyadh & Central Region',
    '2021-02-01', true
  ),
  -- Supervisor (Jasco PVC)
  (
    'u0000000-0000-0000-0000-000000000004',
    'osman@jascopvc.com',
    'Osman', NULL,
    '+966 55 000 0004',
    'c0000000-0000-0000-0000-000000000002',
    'supervisor', 'Sales', 'Sales Supervisor',
    'u0000000-0000-0000-0000-000000000003',
    'u0000000-0000-0000-0000-000000000003',
    'Eastern Province & Jubail',
    '2021-08-15', true
  ),
  -- Salesman 1 (Jasco PVC)
  (
    'u0000000-0000-0000-0000-000000000005',
    'amer@jascopvc.com',
    'Amer', NULL,
    '+966 55 000 0005',
    'c0000000-0000-0000-0000-000000000002',
    'staff', 'Sales', 'Sales Executive',
    'u0000000-0000-0000-0000-000000000004',
    'u0000000-0000-0000-0000-000000000004',
    'Riyadh',
    '2022-01-10', true
  ),
  -- Salesman 2 (Jasco PVC)
  (
    'u0000000-0000-0000-0000-000000000006',
    'hazem@jascopvc.com',
    'Hazem', NULL,
    '+966 55 000 0006',
    'c0000000-0000-0000-0000-000000000002',
    'staff', 'Sales', 'Sales Executive',
    'u0000000-0000-0000-0000-000000000004',
    'u0000000-0000-0000-0000-000000000004',
    'Dammam & Eastern',
    '2022-05-01', true
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4 · UOM TYPES  (under Jasco PVC)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.uom_types (id, company_id, value, label, sort_order, is_active) VALUES
  ('t0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'TO',  'Tonne',       1, true),
  ('t0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'PC',  'Pieces',      2, true),
  ('t0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'KG',  'Kilogram',    3, true),
  ('t0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'M',   'Meter',       4, true),
  ('t0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'ROL', 'Roll',        5, true),
  ('t0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'BAG', 'Bag (25 kg)', 6, true)
ON CONFLICT (value) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5 · PRODUCT GROUPS  (under Jasco PVC)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.product_groups (id, company_id, name, code, description, is_active) VALUES
  (
    'g0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Special Forming PVC', 'SFPVC',
    'CPVC compounds and specialty PVC formulations for pipe fittings and industrial piping', true
  ),
  (
    'g0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'JAS Slitted Coils', 'JSLIT',
    'Cold-rolled steel coils slitted to customer-specified widths and thicknesses', true
  ),
  (
    'g0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'JAS Full Coils', 'JSCOIL',
    'Full-width cold-rolled and galvanized steel coils', true
  ),
  (
    'g0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'Galvanized Iron Products', 'GI',
    'GI pipes, sheets, and structural steel products', true
  )
ON CONFLICT (company_id, code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6 · PRODUCTS  (under Jasco PVC, prices in SAR per tonne)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.products (
  id, company_id, material, name, code, description,
  product_group_id, unit_of_measure_id,
  material_group, base_unit_of_measure,
  price, currency_code, is_active
) VALUES
  -- SFPVC group
  (
    'p0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'CSCPVCFITS80', 'CPVC Fittings Compound Sch-80', 'CSCPVCFITS80',
    'CPVC Fittings Compound Schedule 80 — high-pressure pipe fittings compound',
    'g0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
    'SFPVC', 'TO', 8500.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'CSCPVCGRYS80', 'CPVC Compound Gray Sch-80', 'CSCPVCGRYS80',
    'CPVC Compound Gray for Schedule 80 — grey-colored CPVC blend',
    'g0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001',
    'SFPVC', 'TO', 7200.00, 'SAR', true
  ),
  -- JSLIT group
  (
    'p0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR075063', 'CR Coil Slitted 0.75×063mm', 'CSCR075063',
    'Cold-rolled coil slitted T×W 0.75×063 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 5800.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR075079', 'CR Coil Slitted 0.75×080mm', 'CSCR075079',
    'Cold-rolled coil slitted T×W 0.75×080 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 5800.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR075099', 'CR Coil Slitted 0.75×099mm', 'CSCR075099',
    'Cold-rolled coil slitted T×W 0.75×099 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 5900.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR080063', 'CR Coil Slitted 0.80×063mm', 'CSCR080063',
    'Cold-rolled coil slitted T×W 0.80×063 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6000.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR080079', 'CR Coil Slitted 0.80×079mm', 'CSCR080079',
    'Cold-rolled coil slitted T×W 0.80×079 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6000.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR095063', 'CR Coil Slitted 0.95×063mm', 'CSCR095063',
    'Cold-rolled coil slitted T×W 0.95×063 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6200.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR095069', 'CR Coil Slitted 0.95×069mm', 'CSCR095069',
    'Cold-rolled coil slitted T×W 0.95×069 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6200.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR095079', 'CR Coil Slitted 0.95×079mm', 'CSCR095079',
    'Cold-rolled coil slitted T×W 0.95×079 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6300.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR095093', 'CR Coil Slitted 0.95×093mm', 'CSCR095093',
    'Cold-rolled coil slitted T×W 0.95×093 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6400.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR095099', 'CR Coil Slitted 0.95×099mm', 'CSCR095099',
    'Cold-rolled coil slitted T×W 0.95×099 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6400.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR095119', 'CR Coil Slitted 0.95×119mm', 'CSCR095119',
    'Cold-rolled coil slitted T×W 0.95×119 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6500.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR115062', 'CR Coil Slitted 1.15×062mm', 'CSCR115062',
    'Cold-rolled coil slitted T×W 1.15×062 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6800.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR115078', 'CR Coil Slitted 1.15×078mm', 'CSCR115078',
    'Cold-rolled coil slitted T×W 1.15×078 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6800.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000016',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR115098', 'CR Coil Slitted 1.15×098mm', 'CSCR115098',
    'Cold-rolled coil slitted T×W 1.15×098 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 6900.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000017',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR115118', 'CR Coil Slitted 1.15×118mm', 'CSCR115118',
    'Cold-rolled coil slitted T×W 1.15×118 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 7000.00, 'SAR', true
  ),
  (
    'p0000000-0000-0000-0000-000000000018',
    'c0000000-0000-0000-0000-000000000002',
    'CSCR145061', 'CR Coil Slitted 1.45×061mm', 'CSCR145061',
    'Cold-rolled coil slitted T×W 1.45×061 mm',
    'g0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001',
    'JSLIT', 'TO', 7500.00, 'SAR', true
  )
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7 · CONTACTS  (15 Saudi industrial companies — unchanged)
-- owner_id: amer (u5) handles odd-numbered, hazem (u6) handles even-numbered
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.contacts (
  id, company_id, first_name, last_name, email, phone, mobile,
  job_title, company_name, company_website,
  status, source, owner_id,
  city, country, tags, notes, is_active
) VALUES
  (
    'k0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Ali', 'Al-Hassan',
    'ali.hassan@aramco.com', '+966 13 872 0001', '+966 55 200 0001',
    'Procurement Manager', 'Saudi Aramco', 'https://www.saudiaramco.com',
    'qualified', 'referral', 'u0000000-0000-0000-0000-000000000005',
    'Dhahran', 'Saudi Arabia',
    ARRAY['key-account','energy','tier-1'],
    'Primary procurement contact for Aramco downstream projects. High purchase volumes Q1-Q2.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'Badr', 'Al-Mutairi',
    'badr.mutairi@sabic.com', '+966 13 345 0002', '+966 55 200 0002',
    'Purchasing Director', 'SABIC Industries', 'https://www.sabic.com',
    'negotiation', 'linkedin', 'u0000000-0000-0000-0000-000000000005',
    'Jubail', 'Saudi Arabia',
    ARRAY['key-account','petrochemical','tier-1'],
    'Annual framework contract under review. SABIC requires ISO 9001 certification documentation.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'Turki', 'Al-Anazi',
    'turki.anazi@sec.com.sa', '+966 11 456 0003', '+966 55 200 0003',
    'Technical Manager', 'Saudi Electricity Company', 'https://www.se.com.sa',
    'proposal', 'cold_call', 'u0000000-0000-0000-0000-000000000006',
    'Riyadh', 'Saudi Arabia',
    ARRAY['utility','government','tier-2'],
    'SEC expanding grid infrastructure. Interested in GI pipes for substation projects.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'Nasser', 'Al-Subaie',
    'nasser.subaie@alrajhi-contracting.com', '+966 11 567 0004', '+966 55 200 0004',
    'Project Manager', 'Al-Rajhi Contracting', NULL,
    'negotiation', 'referral', 'u0000000-0000-0000-0000-000000000006',
    'Riyadh', 'Saudi Arabia',
    ARRAY['construction','private','tier-2'],
    'Vision 2030 residential projects. Needs CPVC for plumbing in 3 upcoming towers.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'Saad', 'Al-Bishi',
    'saad.bishi@arabian-pipe.com', '+966 13 678 0005', '+966 55 200 0005',
    'Operations Director', 'Arabian Pipe Company', 'https://www.arabian-pipe.com',
    'qualified', 'event', 'u0000000-0000-0000-0000-000000000005',
    'Jubail', 'Saudi Arabia',
    ARRAY['manufacturing','industrial','tier-1'],
    'Met at Big 5 Saudi expo. APC is a large consumer of slitted CR coil for pipe manufacturing.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000002',
    'Jaber', 'Al-Otaibi',
    'jaber.otaibi@tasnee.com', '+966 11 789 0006', '+966 55 200 0006',
    'Procurement Lead', 'National Industrialization Co. (Tasnee)', 'https://www.tasnee.com',
    'proposal', 'linkedin', 'u0000000-0000-0000-0000-000000000006',
    'Riyadh', 'Saudi Arabia',
    ARRAY['petrochemical','tier-1'],
    'Tasnee uses large volumes of CPVC for chemical plant piping. Decision Q3 2026.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000002',
    'Reem', 'Al-Harthy',
    'reem.harthy@almarai.com', '+966 11 234 0007', '+966 55 200 0007',
    'Supply Chain Manager', 'Almarai Company', 'https://www.almarai.com',
    'qualified', 'referral', 'u0000000-0000-0000-0000-000000000005',
    'Al-Kharj', 'Saudi Arabia',
    ARRAY['fmcg','private','tier-2'],
    'Almarai dairy processing plants require CPVC pipes for hygienic applications.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000002',
    'Hamad', 'Al-Dossari',
    'hamad.dossari@khodari.com', '+966 13 345 0008', '+966 55 200 0008',
    'Contracts Manager', 'Al-Khodari Construction', 'https://www.khodari.com',
    'proposal', 'website', 'u0000000-0000-0000-0000-000000000006',
    'Dammam', 'Saudi Arabia',
    ARRAY['construction','tier-2'],
    'Al-Khodari is working on NEOM sub-projects. Interested in slitted coils for modular buildings.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000002',
    'Yazid', 'Al-Shehri',
    'yazid.shehri@nesma.com.sa', '+966 11 456 0009', '+966 55 200 0009',
    'Technical Buyer', 'Nesma & Partners Contracting', 'https://www.nesma.com.sa',
    'qualified', 'cold_call', 'u0000000-0000-0000-0000-000000000005',
    'Riyadh', 'Saudi Arabia',
    ARRAY['construction','epc','tier-2'],
    'Nesma handles large EPC projects. Quoted 200TO of slitted coil for current project.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000002',
    'Bandar', 'Al-Qahtani',
    'bandar.qahtani@zamil.com', '+966 13 567 0010', '+966 55 200 0010',
    'Projects Director', 'Zamil Steel Buildings', 'https://www.zamilsteel.com',
    'proposal', 'referral', 'u0000000-0000-0000-0000-000000000006',
    'Dammam', 'Saudi Arabia',
    ARRAY['steel','manufacturing','tier-1'],
    'Zamil is a leading pre-engineered steel building maker. Large potential for full coil supply.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000002',
    'Sulaiman', 'Al-Shamri',
    'sulaiman.shamri@saudimix.com', '+966 12 678 0011', '+966 55 200 0011',
    'Site Manager', 'Saudi Readymix Concrete', NULL,
    'contacted', 'email', 'u0000000-0000-0000-0000-000000000005',
    'Jeddah', 'Saudi Arabia',
    ARRAY['construction','tier-3'],
    'Initial contact via email campaign. Sent product catalogue. Follow-up scheduled.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000002',
    'Maher', 'Al-Ruwaili',
    'maher.ruwaili@bechtel.com', '+966 11 789 0012', '+966 55 200 0012',
    'Operations Lead', 'Bechtel Arabia Ltd', 'https://www.bechtel.com',
    'qualified', 'linkedin', 'u0000000-0000-0000-0000-000000000006',
    'Riyadh', 'Saudi Arabia',
    ARRAY['epc','multinational','tier-1'],
    'Bechtel is running multiple giga-projects. Potential for large CPVC & slitted coil orders.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000002',
    'Ziad', 'Al-Ghamdi',
    'ziad.ghamdi@aljomaih.com', '+966 11 234 0013', '+966 55 200 0013',
    'General Manager', 'Al-Jomaih Group', NULL,
    'new', 'referral', 'u0000000-0000-0000-0000-000000000005',
    'Riyadh', 'Saudi Arabia',
    ARRAY['conglomerate','tier-2'],
    'Referred by Aramco contact. Al-Jomaih has multiple divisions that could use our products.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000002',
    'Hassan', 'Al-Shaikh',
    'hassan.shaikh@nwc.com.sa', '+966 11 345 0014', '+966 55 200 0014',
    'Procurement Head', 'National Water Company', 'https://www.nwc.com.sa',
    'qualified', 'event', 'u0000000-0000-0000-0000-000000000006',
    'Riyadh', 'Saudi Arabia',
    ARRAY['utility','government','tier-1'],
    'NWC is upgrading water distribution networks nationwide. CPVC pipes critical for this project.', true
  ),
  (
    'k0000000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000002',
    'Ahmad', 'Al-Zahir',
    'ahmad.zahir@dar.com', '+966 11 456 0015', '+966 55 200 0015',
    'Supply Director', 'Dar Al Riyadh Group', 'https://www.dar.com',
    'contacted', 'website', 'u0000000-0000-0000-0000-000000000005',
    'Riyadh', 'Saudi Arabia',
    ARRAY['engineering','tier-2'],
    'Dar Al Riyadh handles mixed-use developments. Sent quote for CPVC & slitted coil.', true
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 8 · DEALS  (20 deals under Jasco PVC, all amounts in SAR)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.deals (
  id, company_id, contact_id, title, description,
  amount, currency_code, stage, probability,
  expected_close_date, closed_date,
  owner_id, is_active
) VALUES
  -- WON deals
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000001',
    'Saudi Aramco — CPVC Fittings Supply Q1 2026',
    'Annual supply of CPVC Schedule-80 fittings compound for Aramco downstream facilities. 500TO contract.',
    4250000.00, 'SAR', 'won', 100,
    '2026-01-31', '2026-01-28',
    'u0000000-0000-0000-0000-000000000005', true
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000002',
    'SABIC — CR Slitted Coil Annual Framework 2026',
    'Framework agreement for 2,200TO of slitted CR coil for SABIC Jubail manufacturing complex.',
    12800000.00, 'SAR', 'won', 100,
    '2026-02-28', '2026-02-20',
    'u0000000-0000-0000-0000-000000000005', true
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000003',
    'Saudi Electricity — GI Pipe Supply H1 2026',
    'Supply of GI pipes for grid expansion substations in Central Region. 750 units.',
    3175000.00, 'SAR', 'won', 100,
    '2026-03-15', '2026-03-10',
    'u0000000-0000-0000-0000-000000000006', true
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000005',
    'Arabian Pipe Co — CR Coil Supply Contract Q1-Q2',
    '1,450TO of slitted CR coil (0.75–0.95mm grades) for APC pipe mill in Jubail.',
    8500000.00, 'SAR', 'won', 100,
    '2026-04-30', '2026-04-15',
    'u0000000-0000-0000-0000-000000000005', true
  ),
  -- NEGOTIATION deals
  (
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000004',
    'Al-Rajhi Contracting — CPVC Compound for Towers',
    'CPVC gray compound Schedule-80 for residential tower plumbing — 3 buildings, Riyadh.',
    2100000.00, 'SAR', 'negotiation', 75,
    '2026-05-31', NULL,
    'u0000000-0000-0000-0000-000000000006', true
  ),
  (
    'd0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000002',
    'SABIC — CR Coil Q2-Q3 Extension',
    'Extension of SABIC framework: additional 1,600TO of CR slitted coil for Q2/Q3 demand.',
    9400000.00, 'SAR', 'negotiation', 80,
    '2026-06-30', NULL,
    'u0000000-0000-0000-0000-000000000005', true
  ),
  (
    'd0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000006',
    'Tasnee — CPVC 2026 Annual Contract',
    'Full-year CPVC compound supply for Tasnee chemical plant piping replacement programme.',
    15600000.00, 'SAR', 'negotiation', 70,
    '2026-06-15', NULL,
    'u0000000-0000-0000-0000-000000000006', true
  ),
  -- PROPOSAL deals
  (
    'd0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000008',
    'Al-Khodari Construction — Slitted Coil for Modular Units',
    'Slitted CR coil 1.15mm grade for modular building panels on NEOM sub-project. 300TO.',
    1875000.00, 'SAR', 'proposal', 55,
    '2026-06-30', NULL,
    'u0000000-0000-0000-0000-000000000006', true
  ),
  (
    'd0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000010',
    'Zamil Steel — CR Full Coil Annual Supply',
    '1,200TO of cold-rolled full-width coil for Zamil pre-engineered steel buildings production.',
    7200000.00, 'SAR', 'proposal', 50,
    '2026-07-31', NULL,
    'u0000000-0000-0000-0000-000000000006', true
  ),
  (
    'd0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000014',
    'National Water Company — CPVC Pipe Supply',
    'CPVC Schedule-80 compound for NWC water distribution network upgrade — Phase 1.',
    4500000.00, 'SAR', 'proposal', 60,
    '2026-07-15', NULL,
    'u0000000-0000-0000-0000-000000000005', true
  ),
  -- QUALIFIED deals
  (
    'd0000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000009',
    'Nesma Contracting — Slitted Coil Project Supply',
    '200TO slitted CR coil (0.95mm) for Nesma EPC project. Technical specs approved.',
    950000.00, 'SAR', 'qualified', 35,
    '2026-07-31', NULL,
    'u0000000-0000-0000-0000-000000000005', true
  ),
  (
    'd0000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000001',
    'Saudi Aramco — Q3 Additional CPVC Order',
    'Follow-on order for CPVC fittings compound — Aramco Dhahran refinery maintenance programme.',
    2850000.00, 'SAR', 'qualified', 40,
    '2026-08-31', NULL,
    'u0000000-0000-0000-0000-000000000005', true
  ),
  (
    'd0000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000012',
    'Bechtel Arabia — Project Materials Package',
    'CPVC + slitted coil materials package for Bechtel infrastructure project — Riyadh Metro line.',
    6800000.00, 'SAR', 'qualified', 30,
    '2026-09-30', NULL,
    'u0000000-0000-0000-0000-000000000006', true
  ),
  -- LEAD deals
  (
    'd0000000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000007',
    'Almarai — CPVC Hygienic Piping',
    'CPVC compound for hygienic piping in new Almarai dairy processing facility. Early stage.',
    425000.00, 'SAR', 'lead', 15,
    '2026-09-30', NULL,
    'u0000000-0000-0000-0000-000000000005', true
  ),
  (
    'd0000000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000013',
    'Al-Jomaih Group — CR Coil Procurement',
    'Initial enquiry from Al-Jomaih for slitted CR coil supply across their industrial division.',
    2750000.00, 'SAR', 'lead', 10,
    '2026-10-31', NULL,
    'u0000000-0000-0000-0000-000000000005', true
  ),
  (
    'd0000000-0000-0000-0000-000000000016',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000015',
    'Dar Al Riyadh — Infrastructure Materials',
    'Mixed CPVC and slitted coil for Dar Al Riyadh mixed-use development project.',
    3900000.00, 'SAR', 'lead', 10,
    '2026-11-30', NULL,
    'u0000000-0000-0000-0000-000000000006', true
  ),
  -- ON HOLD
  (
    'd0000000-0000-0000-0000-000000000017',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000014',
    'National Water — Phase 2 (Budget Review)',
    'NWC Phase 2 network upgrade. Project on hold pending government budget re-allocation.',
    5600000.00, 'SAR', 'on_hold', 20,
    '2026-12-31', NULL,
    'u0000000-0000-0000-0000-000000000005', true
  ),
  -- LOST deals
  (
    'd0000000-0000-0000-0000-000000000018',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000011',
    'Saudi Readymix — Slitted Coil (Lost to Competitor)',
    'Lost to local competitor on price. Competitor offered 3% lower FOB Jubail.',
    1200000.00, 'SAR', 'lost', 0,
    '2026-03-31', '2026-03-28',
    'u0000000-0000-0000-0000-000000000005', true
  ),
  (
    'd0000000-0000-0000-0000-000000000019',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000003',
    'Saudi Electricity — CPVC (Budget Cancelled)',
    'SEC CPVC trial order — cancelled due to budget freeze following Q1 capital review.',
    850000.00, 'SAR', 'lost', 0,
    '2026-02-28', '2026-02-25',
    'u0000000-0000-0000-0000-000000000006', true
  ),
  (
    'd0000000-0000-0000-0000-000000000020',
    'c0000000-0000-0000-0000-000000000002',
    'k0000000-0000-0000-0000-000000000005',
    'Arabian Pipe Co — GI Sheet Package',
    'Arabian Pipe requested GI sheet quote — decided to source directly from steel mill.',
    675000.00, 'SAR', 'lost', 0,
    '2026-04-15', '2026-04-10',
    'u0000000-0000-0000-0000-000000000005', true
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 9 · TASKS  (15 tasks under Jasco PVC)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.tasks (
  id, company_id, title, description,
  type, status, priority,
  due_date, assigned_to, owner_id,
  contact_id, deal_id, is_active
) VALUES
  (
    'ta000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Call Badr Al-Mutairi re: SABIC Q2 extension pricing',
    'Discuss revised SAR pricing for the Q2 extension. SABIC expects 1.5% discount on 1,600TO.',
    'call', 'open', 'high',
    '2026-05-05',
    'u0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000005',
    'k0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000006',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'Send revised proposal to Al-Rajhi Contracting',
    'Revise CPVC compound quote including VAT breakdown and delivery schedule.',
    'email', 'open', 'high',
    '2026-05-06',
    'u0000000-0000-0000-0000-000000000006',
    'u0000000-0000-0000-0000-000000000006',
    'k0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000005',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'Site visit — Tasnee Jubail plant',
    'Technical presentation of CPVC product range to Tasnee engineering and procurement teams.',
    'meeting', 'open', 'critical',
    '2026-05-08',
    'u0000000-0000-0000-0000-000000000006',
    'u0000000-0000-0000-0000-000000000006',
    'k0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000007',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'Follow up with National Water Company on Phase 1 proposal',
    'Check decision timeline. NWC procurement cycle is end of May.',
    'follow_up', 'open', 'high',
    '2026-05-10',
    'u0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000005',
    'k0000000-0000-0000-0000-000000000014',
    'd0000000-0000-0000-0000-000000000010',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'Send ISO 9001 documentation to SABIC',
    'SABIC procurement requires our ISO 9001 cert + quality manual before finalising contract.',
    'email', 'in_progress', 'critical',
    '2026-05-03',
    'u0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000005',
    'k0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000006',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000002',
    'Prepare Zamil Steel technical specification sheet',
    'Zamil requested full-width coil specs: tensile strength, thickness tolerance, surface finish.',
    'other', 'open', 'medium',
    '2026-05-12',
    'u0000000-0000-0000-0000-000000000006',
    'u0000000-0000-0000-0000-000000000006',
    'k0000000-0000-0000-0000-000000000010',
    'd0000000-0000-0000-0000-000000000009',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000002',
    'Call Yazid Al-Shehri — Nesma project timeline update',
    'Nesma project start date may move. Confirm if our coil delivery slot still valid.',
    'call', 'open', 'medium',
    '2026-05-14',
    'u0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000005',
    'k0000000-0000-0000-0000-000000000009',
    'd0000000-0000-0000-0000-000000000011',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000002',
    'Meeting with Bechtel Arabia procurement — Riyadh office',
    'Intro meeting to present Jasco PVC product portfolio. Bring samples of slitted coil grades.',
    'meeting', 'open', 'medium',
    '2026-05-18',
    'u0000000-0000-0000-0000-000000000006',
    'u0000000-0000-0000-0000-000000000006',
    'k0000000-0000-0000-0000-000000000012',
    'd0000000-0000-0000-0000-000000000013',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000002',
    'Send Almarai initial CPVC product brochure',
    'Almarai dairy processing needs food-grade compliant CPVC. Send hygienic spec sheet.',
    'email', 'open', 'low',
    '2026-05-20',
    'u0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000005',
    'k0000000-0000-0000-0000-000000000007',
    'd0000000-0000-0000-0000-000000000014',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000002',
    'Quarterly review meeting — Aramco procurement',
    'Q1 performance review with Aramco. Discuss H2 forecast and framework renewal.',
    'meeting', 'completed', 'high',
    '2026-04-15',
    'u0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000005',
    'k0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000012',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000002',
    'Follow up Al-Jomaih Group — first meeting request',
    'New lead via referral. Schedule intro meeting with GM Ziad Al-Ghamdi.',
    'follow_up', 'open', 'low',
    '2026-05-25',
    'u0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000005',
    'k0000000-0000-0000-0000-000000000013',
    'd0000000-0000-0000-0000-000000000015',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000002',
    'Prepare Al-Khodari construction coil delivery schedule',
    'Al-Khodari needs phased delivery: 100TO/month over 3 months. Prepare logistics plan.',
    'other', 'open', 'medium',
    '2026-05-22',
    'u0000000-0000-0000-0000-000000000006',
    'u0000000-0000-0000-0000-000000000006',
    'k0000000-0000-0000-0000-000000000008',
    'd0000000-0000-0000-0000-000000000008',
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000002',
    'Email Turki Al-Anazi — SEC substation project update',
    'SEC has new project in Eastern Region. Check if our GI pipe specs are approved.',
    'email', 'open', 'medium',
    '2026-05-15',
    'u0000000-0000-0000-0000-000000000006',
    'u0000000-0000-0000-0000-000000000006',
    'k0000000-0000-0000-0000-000000000003',
    NULL,
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000002',
    'Prepare monthly sales report — April 2026',
    'Compile April actuals vs. targets for manager review. Include pipeline summary.',
    'other', 'completed', 'medium',
    '2026-05-01',
    'u0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000005',
    NULL, NULL,
    true
  ),
  (
    'ta000000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000002',
    'Call Maher Al-Ruwaili — Bechtel project specification approval',
    'Bechtel engineering team needs to approve coil specifications before PO issuance.',
    'call', 'open', 'high',
    '2026-05-28',
    'u0000000-0000-0000-0000-000000000006',
    'u0000000-0000-0000-0000-000000000006',
    'k0000000-0000-0000-0000-000000000012',
    'd0000000-0000-0000-0000-000000000013',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 10 · ACTIVITIES  (20 timeline entries under Jasco PVC)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.activities (
  id, company_id, type, title, description,
  contact_id, deal_id,
  created_by, activity_date,
  duration_minutes, outcome, next_steps
) VALUES
  (
    'ac000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'meeting', 'Aramco Q1 Kick-off Meeting — Dhahran',
    'Presented Q1 delivery schedule and pricing. Aramco confirmed PO for 500TO CPVC compound.',
    'k0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000005',
    '2026-01-10 10:00:00+03', 90, 'positive', 'Await formal PO within 5 business days.'
  ),
  (
    'ac000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'call', 'SABIC Framework Agreement Call — Badr Al-Mutairi',
    'Discussed 2026 framework volumes. SABIC confirmed 2,200TO CR slitted coil requirement.',
    'k0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002',
    'u0000000-0000-0000-0000-000000000005',
    '2026-01-15 14:30:00+03', 45, 'positive', 'Prepare formal framework proposal by 20 Jan.'
  ),
  (
    'ac000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'email', 'Sent SABIC framework proposal — ﷼12.8M',
    'Emailed full framework proposal including pricing, delivery schedule, and quality certs.',
    'k0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002',
    'u0000000-0000-0000-0000-000000000005',
    '2026-01-21 09:00:00+03', NULL, 'sent', 'Follow up in 1 week.'
  ),
  (
    'ac000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'meeting', 'SEC Technical Presentation — Riyadh HQ',
    'Presented GI pipe product range to SEC technical committee. Positive reception.',
    'k0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003',
    'u0000000-0000-0000-0000-000000000006',
    '2026-02-05 11:00:00+03', 120, 'positive', 'SEC to review specs internally. Follow up in 2 weeks.'
  ),
  (
    'ac000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'call', 'Arabian Pipe — Coil spec confirmation call',
    'APC confirmed coil grades: 0.75–0.95mm slitted, minimum 500TO/month from March.',
    'k0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004',
    'u0000000-0000-0000-0000-000000000005',
    '2026-02-18 10:00:00+03', 30, 'positive', 'Issue contract draft by end of Feb.'
  ),
  (
    'ac000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000002',
    'note', 'Al-Rajhi lead qualification note',
    'Verified Al-Rajhi Contracting has 3 active tower projects in Riyadh needing CPVC. Qualified.',
    'k0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000006',
    '2026-03-01 08:30:00+03', NULL, NULL, 'Schedule site visit and send CPVC proposal.'
  ),
  (
    'ac000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000002',
    'email', 'Sent CPVC proposal to Al-Rajhi — ﷼2.1M',
    'Emailed detailed proposal for CPVC Schedule-80 compound for 3 residential tower projects.',
    'k0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000006',
    '2026-03-08 12:00:00+03', NULL, 'sent', 'Follow up next week. Al-Rajhi has 30-day review cycle.'
  ),
  (
    'ac000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000002',
    'meeting', 'Tasnee Jubail Plant Visit',
    'Toured Tasnee CPVC installation areas. Met engineering lead. 15,600TO annual potential confirmed.',
    'k0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000007',
    'u0000000-0000-0000-0000-000000000006',
    '2026-03-20 09:00:00+03', 180, 'very_positive', 'Prepare annual contract proposal by April. High priority.'
  ),
  (
    'ac000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000002',
    'call', 'NWC procurement — Phase 1 scope call',
    'NWC confirmed Phase 1 CPVC scope: 530TO compound for water mains upgrade in Riyadh.',
    'k0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000010',
    'u0000000-0000-0000-0000-000000000005',
    '2026-03-25 14:00:00+03', 45, 'positive', 'Submit formal technical proposal by April 15.'
  ),
  (
    'ac000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000002',
    'note', 'Competitive loss note — Saudi Readymix',
    'Lost deal to local competitor Al-Steel Trading at 3% lower price. Review pricing for Jeddah.',
    'k0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000018',
    'u0000000-0000-0000-0000-000000000005',
    '2026-03-28 16:00:00+03', NULL, 'lost', 'Revisit in Q4 when new contract cycle opens.'
  ),
  (
    'ac000000-0000-0000-0000-000000000011',
    'c0000000-0000-0000-0000-000000000002',
    'email', 'Sent Zamil Steel full-coil specification sheet',
    'Detailed technical specs: tensile strength, YS, elongation, surface quality.',
    'k0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000009',
    'u0000000-0000-0000-0000-000000000006',
    '2026-04-02 10:30:00+03', NULL, 'sent', 'Await Zamil engineering review. Follow up April 15.'
  ),
  (
    'ac000000-0000-0000-0000-000000000012',
    'c0000000-0000-0000-0000-000000000002',
    'meeting', 'Aramco Q1 Review & H2 Planning — Dhahran',
    'Reviewed Q1 delivery performance (on-time 98%). H2 forecast: 600TO CPVC expected.',
    'k0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000012',
    'u0000000-0000-0000-0000-000000000005',
    '2026-04-15 10:00:00+03', 120, 'very_positive', 'Submit Q3 volume commitment by May 15.'
  ),
  (
    'ac000000-0000-0000-0000-000000000013',
    'c0000000-0000-0000-0000-000000000002',
    'call', 'SABIC Q2 extension preliminary discussion',
    'Badr confirmed SABIC needs additional 1,600TO. Pricing negotiation — SABIC wants 2% off.',
    'k0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006',
    'u0000000-0000-0000-0000-000000000005',
    '2026-04-20 11:30:00+03', 40, 'positive', 'Counter-offer: 0.8% discount with 100% prepayment.'
  ),
  (
    'ac000000-0000-0000-0000-000000000014',
    'c0000000-0000-0000-0000-000000000002',
    'meeting', 'Al-Khodari NEOM project briefing',
    'Al-Khodari PM briefed on NEOM subproject scope: 300TO slitted coil 1.15mm for modular units.',
    'k0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000008',
    'u0000000-0000-0000-0000-000000000006',
    '2026-04-22 13:00:00+03', 90, 'positive', 'Prepare phased delivery proposal: 100TO/month × 3 months.'
  ),
  (
    'ac000000-0000-0000-0000-000000000015',
    'c0000000-0000-0000-0000-000000000002',
    'email', 'Sent Bechtel Arabia product portfolio',
    'Introduced Jasco PVC to Bechtel Arabia procurement. Sent full product catalogue and project refs.',
    'k0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000013',
    'u0000000-0000-0000-0000-000000000006',
    '2026-04-25 09:00:00+03', NULL, 'sent', 'Schedule in-person meeting for May.'
  ),
  (
    'ac000000-0000-0000-0000-000000000016',
    'c0000000-0000-0000-0000-000000000002',
    'call', 'Nesma Contracting — coil delivery window call',
    'Yazid confirmed project start pushed to August. Adjusted delivery slot accordingly.',
    'k0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000011',
    'u0000000-0000-0000-0000-000000000005',
    '2026-04-28 15:00:00+03', 20, 'neutral', 'Reschedule production slot to July. Update proposal validity.'
  ),
  (
    'ac000000-0000-0000-0000-000000000017',
    'c0000000-0000-0000-0000-000000000002',
    'note', 'Tasnee contract negotiation update',
    'Tasnee legal team reviewed draft contract. Two minor clauses flagged on force majeure and IP.',
    'k0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000007',
    'u0000000-0000-0000-0000-000000000006',
    '2026-04-30 17:00:00+03', NULL, NULL, 'Legal team to respond within 5 days. Close expected June 15.'
  ),
  (
    'ac000000-0000-0000-0000-000000000018',
    'c0000000-0000-0000-0000-000000000002',
    'call', 'Al-Rajhi — final pricing negotiation call',
    'Al-Rajhi accepted pricing after Jasco PVC offered free delivery to Riyadh site.',
    'k0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005',
    'u0000000-0000-0000-0000-000000000006',
    '2026-05-01 10:00:00+03', 30, 'very_positive', 'Issue contract for signature by May 5.'
  ),
  (
    'ac000000-0000-0000-0000-000000000019',
    'c0000000-0000-0000-0000-000000000002',
    'meeting', 'Monthly sales team review — April actuals',
    'Team reviewed April performance: ﷼8.5M won (Aramco + APC). Pipeline ﷼62M. On track for Q2.',
    NULL, NULL,
    'u0000000-0000-0000-0000-000000000003',
    '2026-05-01 08:30:00+03', 60, 'positive', 'Focus May push on Tasnee close and SABIC extension.'
  ),
  (
    'ac000000-0000-0000-0000-000000000020',
    'c0000000-0000-0000-0000-000000000002',
    'note', 'New lead: Al-Jomaih Group (via Aramco referral)',
    'Ali Hassan at Aramco referred us to Al-Jomaih industrial division. ﷼2.75M+ CR coil potential.',
    'k0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000015',
    'u0000000-0000-0000-0000-000000000005',
    '2026-05-01 14:00:00+03', NULL, NULL, 'Contact Ziad Al-Ghamdi and schedule intro meeting.'
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 11 · FORECASTS  (4 Jasco PVC team members × 6 months, SAR)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.forecasts (
  id, company_id, user_id, forecast_month,
  forecast_amount, actual_amount, currency_code, status, notes
) VALUES
  -- Sales Manager (Mohamed Kamal) — team consolidated forecast
  ('f0000000-0000-0000-0000-000000000101','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-01-01',9500000,9750250,'SAR','approved','Q1 opened strong. Aramco and SABIC deals closed.'),
  ('f0000000-0000-0000-0000-000000000102','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-02-01',10200000,9980000,'SAR','approved','SABIC framework won. SEC deal in pipeline.'),
  ('f0000000-0000-0000-0000-000000000103','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-03-01',11000000,10650000,'SAR','approved','APC contract won. Lost Saudi Readymix.'),
  ('f0000000-0000-0000-0000-000000000104','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-04-01',12500000,11675000,'SAR','approved','April: SEC + APC partial. Q2 momentum building.'),
  ('f0000000-0000-0000-0000-000000000105','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-05-01',13500000,NULL,'SAR','submitted','Expect Tasnee and Al-Rajhi to close this month.'),
  ('f0000000-0000-0000-0000-000000000106','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-06-01',15000000,NULL,'SAR','draft','H1 close target. SABIC extension + Zamil expected.'),
  -- Supervisor (Osman)
  ('f0000000-0000-0000-0000-000000000201','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000004','2026-01-01',4200000,4350000,'SAR','approved','Strong Jan — Eastern Province deals closed.'),
  ('f0000000-0000-0000-0000-000000000202','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000004','2026-02-01',4500000,4210000,'SAR','approved',NULL),
  ('f0000000-0000-0000-0000-000000000203','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000004','2026-03-01',4800000,5100000,'SAR','approved','Exceeded target — APC contract contribution.'),
  ('f0000000-0000-0000-0000-000000000204','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000004','2026-04-01',5200000,4930000,'SAR','approved',NULL),
  ('f0000000-0000-0000-0000-000000000205','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000004','2026-05-01',5800000,NULL,'SAR','submitted','Targeting Tasnee close and Zamil proposal.'),
  ('f0000000-0000-0000-0000-000000000206','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000004','2026-06-01',6200000,NULL,'SAR','draft',NULL),
  -- Staff — Amer
  ('f0000000-0000-0000-0000-000000000301','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000005','2026-01-01',2800000,3150000,'SAR','approved','Aramco Q1 close + SABIC contribution.'),
  ('f0000000-0000-0000-0000-000000000302','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000005','2026-02-01',3000000,2870000,'SAR','approved',NULL),
  ('f0000000-0000-0000-0000-000000000303','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000005','2026-03-01',3200000,3050000,'SAR','approved',NULL),
  ('f0000000-0000-0000-0000-000000000304','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000005','2026-04-01',3500000,3420000,'SAR','approved',NULL),
  ('f0000000-0000-0000-0000-000000000305','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000005','2026-05-01',3800000,NULL,'SAR','submitted','Expecting Aramco Q3 + NWC Phase 1 close.'),
  ('f0000000-0000-0000-0000-000000000306','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000005','2026-06-01',4000000,NULL,'SAR','draft',NULL),
  -- Staff — Hazem
  ('f0000000-0000-0000-0000-000000000401','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000006','2026-01-01',2100000,2200000,'SAR','approved',NULL),
  ('f0000000-0000-0000-0000-000000000402','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000006','2026-02-01',2300000,2080000,'SAR','approved',NULL),
  ('f0000000-0000-0000-0000-000000000403','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000006','2026-03-01',2500000,2650000,'SAR','approved','SEC GI pipe deal contribution.'),
  ('f0000000-0000-0000-0000-000000000404','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000006','2026-04-01',2800000,2745000,'SAR','approved',NULL),
  ('f0000000-0000-0000-0000-000000000405','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000006','2026-05-01',3200000,NULL,'SAR','submitted','Targeting Al-Rajhi + Tasnee close.'),
  ('f0000000-0000-0000-0000-000000000406','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000006','2026-06-01',3500000,NULL,'SAR','draft',NULL)
ON CONFLICT (company_id, user_id, forecast_month) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 12 · KPIs
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.kpis (
  id, company_id, user_id, kpi_month,
  metric_name, target_value, actual_value, unit, status, notes
) VALUES
  -- Sales Manager KPIs — April 2026
  ('kp000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-04-01','Monthly Revenue','12500000','11675000','SAR','completed','93% of target. Strong pipeline heading into May.'),
  ('kp000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-04-01','New Deals Created','8','7','count','completed',NULL),
  ('kp000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-04-01','Win Rate','40','38','percent','completed',NULL),
  ('kp000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-04-01','Pipeline Value','60000000','62350000','SAR','completed','Above target. 4 deals in negotiation.'),
  -- Sales Manager KPIs — May 2026 (in progress)
  ('kp000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-05-01','Monthly Revenue','13500000',NULL,'SAR','in_progress',NULL),
  ('kp000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-05-01','New Deals Created','8',NULL,'count','in_progress',NULL),
  ('kp000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000003','2026-05-01','Win Rate','42',NULL,'percent','in_progress',NULL),
  -- Amer KPIs — April 2026
  ('kp000000-0000-0000-0000-000000000011','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000005','2026-04-01','Monthly Revenue','3500000','3420000','SAR','completed',NULL),
  ('kp000000-0000-0000-0000-000000000012','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000005','2026-04-01','Calls Made','60','58','count','completed',NULL),
  ('kp000000-0000-0000-0000-000000000013','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000005','2026-04-01','Meetings Held','12','14','count','completed','Exceeded meetings target.'),
  -- Hazem KPIs — April 2026
  ('kp000000-0000-0000-0000-000000000021','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000006','2026-04-01','Monthly Revenue','2800000','2745000','SAR','completed',NULL),
  ('kp000000-0000-0000-0000-000000000022','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000006','2026-04-01','Calls Made','50','52','count','completed',NULL),
  ('kp000000-0000-0000-0000-000000000023','c0000000-0000-0000-0000-000000000002','u0000000-0000-0000-0000-000000000006','2026-04-01','Proposals Sent','6','5','count','completed',NULL)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 13 · CLIENT TARGETS  (monthly per-client targets, SAR)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.client_targets (
  id, company_id, contact_id,
  target_month, assigned_by, assigned_to,
  target_amount, achieved_amount, currency_code, status, notes
) VALUES
  -- Saudi Aramco targets
  ('ct000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000001','2026-03-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000005',1200000,1250000,'SAR','completed','Exceeded. CPVC Q1 order higher than forecast.'),
  ('ct000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000001','2026-04-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000005',1500000,1420000,'SAR','completed',NULL),
  ('ct000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000001','2026-05-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000005',1800000,NULL,'SAR','active','Q3 order expected end of May.'),
  -- SABIC targets
  ('ct000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000002','2026-03-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000005',4200000,4350000,'SAR','completed','SABIC framework performing above plan.'),
  ('ct000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000002','2026-04-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000005',4500000,4200000,'SAR','completed',NULL),
  ('ct000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000002','2026-05-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000005',5000000,NULL,'SAR','active','Q2 extension negotiation in progress.'),
  -- Arabian Pipe Company targets
  ('ct000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000005','2026-04-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000005',2800000,2950000,'SAR','completed','APC contract won April. First delivery complete.'),
  ('ct000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000005','2026-05-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000005',2800000,NULL,'SAR','active',NULL),
  -- Tasnee targets
  ('ct000000-0000-0000-0000-000000000009','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000006','2026-05-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000006',3500000,NULL,'SAR','active','Contract expected to close by June. Major deal.'),
  ('ct000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000002','k0000000-0000-0000-0000-000000000006','2026-06-01','u0000000-0000-0000-0000-000000000003','u0000000-0000-0000-0000-000000000006',4500000,NULL,'SAR','active',NULL)
ON CONFLICT (company_id, contact_id, target_month) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 14 · PRODUCT GROUP TARGETS  (monthly per-group targets, SAR)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.product_group_targets (
  id, company_id, product_group_id,
  target_month, assigned_by, assigned_to,
  target_amount, achieved_amount,
  target_quantity, achieved_quantity,
  currency_code, status, notes
) VALUES
  -- SFPVC group targets (Jan–May)
  ('pt000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000001','2026-01-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',4500000,4750000,550,580,'SAR','completed','Strong CPVC sales — Aramco deal contributed.'),
  ('pt000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000001','2026-02-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',4800000,4620000,580,555,'SAR','completed',NULL),
  ('pt000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000001','2026-03-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',5000000,4850000,600,580,'SAR','completed',NULL),
  ('pt000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000001','2026-04-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',5500000,5120000,650,610,'SAR','completed',NULL),
  ('pt000000-0000-0000-0000-000000000005','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000001','2026-05-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',7000000,NULL,820,NULL,'SAR','active','Tasnee close expected to push May to record.'),
  -- JSLIT group targets (Jan–May)
  ('pt000000-0000-0000-0000-000000000006','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000002','2026-01-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',5000000,4990000,850,845,'SAR','completed',NULL),
  ('pt000000-0000-0000-0000-000000000007','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000002','2026-02-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',5400000,5360000,900,893,'SAR','completed','SABIC framework driving slitted coil volumes.'),
  ('pt000000-0000-0000-0000-000000000008','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000002','2026-03-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',5800000,5800000,970,970,'SAR','completed','Exactly on target.'),
  ('pt000000-0000-0000-0000-000000000009','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000002','2026-04-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',6500000,6555000,1080,1090,'SAR','completed','APC contract: 1,450TO phased delivery started.'),
  ('pt000000-0000-0000-0000-000000000010','c0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000002','2026-05-01','u0000000-0000-0000-0000-000000000004','u0000000-0000-0000-0000-000000000003',6500000,NULL,1080,NULL,'SAR','active','SABIC Q2 extension in negotiation.')
ON CONFLICT (company_id, product_group_id, target_month) DO NOTHING;

-- =============================================================================
-- END OF DEMO SEED DATA
-- Summary:
--   3 companies  |  6 users  |  6 UOM types  |  4 product groups  |  18 products
--   15 contacts (customers)  |  20 deals (SAR)  |  15 tasks  |  20 activities
--   24 forecasts  |  13 KPIs  |  10 client targets  |  10 product group targets
-- =============================================================================
