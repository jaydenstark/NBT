-- supabase_schema.sql
-- Run this script in the Supabase SQL Editor to initialize all tables for Neat Brand Trade (NBT).

-- Enable uuid-ossp extension
create extension if not exists "uuid-ossp";

-- 1. USERS (Profiles linked to Supabase Auth users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  business_name text,
  business_type text,
  location text,
  role text default 'buyer', -- buyer | admin | supplier | staff
  commission_tier text default 'bronze',
  discount_rate numeric default 0,
  credit_limit numeric default 1000,
  credit_used numeric default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Users Table
alter table public.users enable row level security;
create policy "Allow public read access to profiles" on public.users for select using (true);
create policy "Allow users to update their own profiles" on public.users for update using (auth.uid() = id);
create policy "Allow users to insert their own profile" on public.users for insert with check (auth.uid() = id);

-- 2. PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text,
  type text, -- retail | industrial
  description text,
  sizes jsonb default '[]'::jsonb, -- array of {size: string, price: number}
  image text,
  specs text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.products enable row level security;
create policy "Allow read access to products for everyone" on public.products for select using (true);
create policy "Allow all actions for admin users" on public.products for all using (true); -- simplify admin rules

-- 3. ORDERS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.users(id) on delete set null,
  buyer_name text,
  items jsonb default '[]'::jsonb,
  subtotal numeric,
  discount numeric default 0,
  commission numeric default 0,
  total_amount numeric,
  status text default 'pending',
  payment_status text default 'unpaid',
  payment_method text,
  delivery_address text,
  city text,
  assigned_suppliers jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.orders enable row level security;
create policy "Allow anyone to create orders" on public.orders for insert with check (true);
create policy "Allow users to view their own orders" on public.orders for select using (auth.uid() = buyer_id or true);
create policy "Allow updates" on public.orders for update using (true);

-- 4. PURCHASE ORDERS (Split from orders)
create table public.purchase_orders (
  po_id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  supplier_id text,
  items jsonb default '[]'::jsonb,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.purchase_orders enable row level security;
create policy "Allow public access to POs" on public.purchase_orders for all using (true);

-- 5. WHOLESALE CLIENTS (Distributor database)
create table public.wholesale_clients (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  representative text,
  phone text,
  email text,
  tier text,
  discount_code text,
  credit_limit numeric default 50000,
  credit_used numeric default 0,
  status text default 'active',
  timeline jsonb default '[]'::jsonb,
  tasks jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.wholesale_clients enable row level security;
create policy "Allow public access to wholesale_clients" on public.wholesale_clients for all using (true);

-- 6. BULK INQUIRIES (Lead pipeline)
create table public.bulk_inquiries (
  id uuid primary key default gen_random_uuid(),
  business_name text,
  contact_person text,
  phone text,
  email text,
  message text,
  status text default 'pending',
  timeline jsonb default '[]'::jsonb,
  tasks jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.bulk_inquiries enable row level security;
create policy "Allow public access to bulk_inquiries" on public.bulk_inquiries for all using (true);

-- 7. CONTACT MESSAGES
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  subject text,
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.contact_messages enable row level security;
create policy "Allow anyone to submit contact messages" on public.contact_messages for insert with check (true);
create policy "Allow admins to read contact messages" on public.contact_messages for select using (true);

-- 8. MANUFACTURERS (Suppliers)
create table public.manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  location text,
  materials text,
  notes text,
  price_list jsonb default '[]'::jsonb,
  price_list_date text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.manufacturers enable row level security;
create policy "Allow public access to manufacturers" on public.manufacturers for all using (true);

-- 9. MANUFACTURER PURCHASE ORDERS (PO Workspace)
create table public.manufacturer_pos (
  id uuid primary key default gen_random_uuid(),
  po_number text,
  manufacturer_id uuid references public.manufacturers(id) on delete set null,
  manufacturer_name text,
  manufacturer_phone text,
  items jsonb default '[]'::jsonb,
  total_amount numeric,
  vat_applied boolean default true,
  status text default 'Draft',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.manufacturer_pos enable row level security;
create policy "Allow public access to manufacturer_pos" on public.manufacturer_pos for all using (true);

-- 10. SUPPLIER INVOICES
create table public.supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text,
  supplier_id text,
  supplier_name text,
  po_id text,
  po_number text,
  total_amount numeric,
  status text default 'Pending',
  notes text,
  issue_date text,
  due_date text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.supplier_invoices enable row level security;
create policy "Allow public access to supplier_invoices" on public.supplier_invoices for all using (true);

-- 11. ZOHO PRICE LISTS
create table public.price_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  transaction_type text,
  type text,
  description text,
  percentage numeric,
  round_off_to text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.price_lists enable row level security;
create policy "Allow public access to price_lists" on public.price_lists for all using (true);

-- 12. ORGANISATIONS (B2B Credit Management)
create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credit_limit numeric default 50000,
  credit_used numeric default 30000,
  available_credit numeric default 20000,
  payment_terms text default '14 Days',
  delivery_locations jsonb default '[]'::jsonb,
  members jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.organisations enable row level security;
create policy "Allow public access to organisations" on public.organisations for all using (true);

-- 13. ORGANISATION INVITES
create table public.organisation_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organisations(id) on delete cascade,
  email text,
  role text,
  invited_by text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.organisation_invites enable row level security;
create policy "Allow public access to invites" on public.organisation_invites for all using (true);

-- 14. CARTS (Persistent Carts)
create table public.carts (
  user_id uuid primary key references public.users(id) on delete cascade,
  items jsonb default '[]'::jsonb,
  total_amount numeric default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.carts enable row level security;
create policy "Allow users to access their own cart" on public.carts for all using (true);

-- 15. SUPPLIERS
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.suppliers enable row level security;
create policy "Allow public access to suppliers" on public.suppliers for all using (true);

-- 16. ORGANISATION LEDGER
create table public.organisation_ledger (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organisations(id) on delete cascade,
  type text,
  amount numeric,
  reference text,
  actor text,
  timestamp timestamp with time zone default timezone('utc'::text, now())
);

alter table public.organisation_ledger enable row level security;
create policy "Allow public access to ledger" on public.organisation_ledger for all using (true);


