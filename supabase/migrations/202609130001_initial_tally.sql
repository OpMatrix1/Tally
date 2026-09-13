create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'expense' check (kind in ('expense','income')),
  color text default '#D9A441',
  monthly_budget numeric(12,2),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  description text,
  occurred_on date not null default current_date,
  receipt_path text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_occurred_on_idx on public.transactions (user_id, occurred_on);
create index if not exists transactions_user_category_id_idx on public.transactions (user_id, category_id);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "own rows only" on public.categories;
create policy "own rows only" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows only" on public.transactions;
create policy "own rows only" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.summary_by_category(p_year int, p_month int)
returns table (category_id uuid, category_name text, kind text, total numeric)
language sql
security invoker
as $$
  select c.id, c.name, c.kind, coalesce(sum(t.amount), 0) as total
  from public.categories c
  left join public.transactions t
    on t.category_id = c.id
    and extract(year from t.occurred_on) = p_year
    and extract(month from t.occurred_on) = p_month
  where c.user_id = auth.uid()
  group by c.id, c.name, c.kind
  order by total desc;
$$;

create or replace function public.summary_by_month(p_months int default 6)
returns table (month date, total_expense numeric, total_income numeric)
language sql
security invoker
as $$
  select
    date_trunc('month', t.occurred_on)::date as month,
    sum(t.amount) filter (where c.kind = 'expense') as total_expense,
    sum(t.amount) filter (where c.kind = 'income') as total_income
  from public.transactions t
  join public.categories c on c.id = t.category_id
  where t.user_id = auth.uid()
    and t.occurred_on >= (current_date - (p_months || ' months')::interval)
  group by 1
  order by 1;
$$;

create or replace function public.budget_vs_actual(p_year int, p_month int)
returns table (category_id uuid, category_name text, budget numeric, spent numeric, remaining numeric)
language sql
security invoker
as $$
  select
    c.id, c.name, c.monthly_budget,
    coalesce(sum(t.amount), 0) as spent,
    c.monthly_budget - coalesce(sum(t.amount), 0) as remaining
  from public.categories c
  left join public.transactions t
    on t.category_id = c.id
    and extract(year from t.occurred_on) = p_year
    and extract(month from t.occurred_on) = p_month
  where c.user_id = auth.uid() and c.kind = 'expense' and c.monthly_budget is not null
  group by c.id, c.name, c.monthly_budget;
$$;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "own receipt objects" on storage.objects;
create policy "own receipt objects" on storage.objects
  for all
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
