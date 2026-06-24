-- ============================================================
-- JackTraders Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  created_at  timestamptz default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  description    text,
  price          numeric(10, 2) not null check (price >= 0),
  discount_price numeric(10, 2) check (discount_price >= 0),
  stock          integer not null default 0 check (stock >= 0),
  category_id    uuid references categories(id) on delete set null,
  images         text[] default '{}',
  featured       boolean default false,
  specifications jsonb default '{}',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id               uuid primary key default uuid_generate_v4(),
  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text,
  delivery_address text not null,
  delivery_fee     numeric(10, 2) default 200,
  total_amount     numeric(10, 2) not null,
  status           text not null default 'pending'
                     check (status in ('pending','confirmed','processing','delivered','cancelled')),
  mpesa_receipt    text,
  notes            text,
  created_at       timestamptz default now()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,
  product_name  text not null,
  product_price numeric(10, 2) not null,
  quantity      integer not null default 1 check (quantity > 0),
  created_at    timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Categories: public read, authenticated write
alter table categories enable row level security;
create policy "Public read categories" on categories for select using (true);
create policy "Auth insert categories" on categories for insert with check (auth.role() = 'authenticated');
create policy "Auth update categories" on categories for update using (auth.role() = 'authenticated');
create policy "Auth delete categories" on categories for delete using (auth.role() = 'authenticated');

-- Products: public read, authenticated write
alter table products enable row level security;
create policy "Public read products" on products for select using (true);
create policy "Auth insert products" on products for insert with check (auth.role() = 'authenticated');
create policy "Auth update products" on products for update using (auth.role() = 'authenticated');
create policy "Auth delete products" on products for delete using (auth.role() = 'authenticated');

-- Orders: anyone can create, only authenticated can read/update
alter table orders enable row level security;
create policy "Anyone create order" on orders for insert with check (true);
create policy "Auth read orders" on orders for select using (auth.role() = 'authenticated');
create policy "Auth update orders" on orders for update using (auth.role() = 'authenticated');

-- Order items: anyone can create, only authenticated can read
alter table order_items enable row level security;
create policy "Anyone create order items" on order_items for insert with check (true);
create policy "Auth read order items" on order_items for select using (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA (Sample categories — customize as needed)
-- ============================================================
insert into categories (name, slug, description) values
  ('Electronics', 'electronics', 'Phones, laptops, gadgets and more'),
  ('Home Appliances', 'home-appliances', 'Fridges, TVs, washing machines and more'),
  ('Furniture', 'furniture', 'Beds, sofas, chairs and tables'),
  ('Clothing', 'clothing', 'Men, women and children clothing'),
  ('Food & Beverages', 'food-beverages', 'Groceries and drinks'),
  ('Sports & Fitness', 'sports-fitness', 'Equipment and sportswear')
on conflict (slug) do nothing;
