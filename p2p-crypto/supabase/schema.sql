create extension if not exists pgcrypto;

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address text not null unique,
  label text not null default 'Main',
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  kyc_status text not null default 'not_started'
    check (kyc_status in ('not_started', 'pending', 'approved', 'rejected')),
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  chain text not null,
  available numeric(20, 8) not null default 0,
  locked numeric(20, 8) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, token, chain)
);

create table if not exists public.wallet_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  chain text not null,
  amount numeric(20, 8) not null,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  locked_until timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_kyc (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  dob date not null,
  pan text not null,
  aadhaar text not null,
  mobile text not null,
  address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  occupation text not null,
  source_of_funds text not null,
  selfie_ref text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.p2p_transfers (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  chain text not null,
  amount numeric(20, 8) not null,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.p2p_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  side text not null check (side in ('buy', 'sell')),
  token text not null,
  chain text not null,
  fiat_currency text not null default 'USD',
  payment_method text not null,
  price numeric(20, 8) not null,
  min_amount numeric(20, 8) not null,
  max_amount numeric(20, 8) not null,
  available_amount numeric(20, 8) not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.p2p_orders (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.p2p_offers(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  chain text not null,
  fiat_currency text not null,
  price numeric(20, 8) not null,
  amount numeric(20, 8) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.wallets enable row level security;
alter table public.user_profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.wallet_balances enable row level security;
alter table public.wallet_deposits enable row level security;
alter table public.user_kyc enable row level security;
alter table public.p2p_transfers enable row level security;
alter table public.p2p_offers enable row level security;
alter table public.p2p_orders enable row level security;

create policy "Wallets are viewable by owner" on public.wallets
  for select using (auth.uid() = user_id);

create policy "Wallets are insertable by owner" on public.wallets
  for insert with check (auth.uid() = user_id);

create policy "Profiles are viewable by owner"
  on public.user_profiles for select using (auth.uid() = user_id);

create policy "Profiles are insertable by owner"
  on public.user_profiles for insert with check (auth.uid() = user_id);

create policy "Profiles are updateable by owner"
  on public.user_profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and kyc_status in ('not_started', 'pending', 'rejected'));

create policy "Admins are viewable by self"
  on public.admin_users for select using (auth.uid() = user_id);

create policy "Balances are viewable by owner"
  on public.wallet_balances for select using (auth.uid() = user_id);

create policy "Balances are insertable by owner"
  on public.wallet_balances for insert with check (auth.uid() = user_id);

create policy "Balances are updateable by owner"
  on public.wallet_balances for update using (auth.uid() = user_id);

create policy "Deposits are viewable by owner"
  on public.wallet_deposits for select using (auth.uid() = user_id);

create policy "Deposits are insertable by owner"
  on public.wallet_deposits for insert with check (auth.uid() = user_id);

create or replace function public.admin_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  kyc_status text,
  account_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select up.user_id, up.email, up.kyc_status, up.account_status, up.created_at
  from public.user_profiles up
  order by up.created_at desc;
end;
$$;

create or replace function public.admin_get_kyc(target_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  full_name text,
  dob date,
  pan text,
  aadhaar text,
  mobile text,
  address text,
  city text,
  state text,
  postal_code text,
  occupation text,
  source_of_funds text,
  selfie_ref text,
  status text,
  review_note text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    k.id,
    k.user_id,
    k.full_name,
    k.dob,
    k.pan,
    k.aadhaar,
    k.mobile,
    k.address,
    k.city,
    k.state,
    k.postal_code,
    k.occupation,
    k.source_of_funds,
    k.selfie_ref,
    k.status,
    k.review_note,
    k.created_at,
    k.updated_at
  from public.user_kyc k
  where k.user_id = target_user_id;
end;
$$;

create or replace function public.admin_list_deposits()
returns table (
  id uuid,
  user_id uuid,
  token text,
  chain text,
  amount numeric,
  status text,
  locked_until timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select d.id, d.user_id, d.token, d.chain, d.amount, d.status, d.locked_until, d.created_at
  from public.wallet_deposits d
  order by d.created_at desc;
end;
$$;

create or replace function public.admin_verify_deposit(
  deposit_id uuid,
  approve boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deposit_record record;
begin
  if not public.admin_is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into deposit_record
  from public.wallet_deposits
  where id = deposit_id
  for update;

  if deposit_record is null then
    raise exception 'Deposit not found';
  end if;

  if deposit_record.status <> 'pending' then
    raise exception 'Deposit already processed';
  end if;

  if approve then
    update public.wallet_balances
      set available = available + deposit_record.amount,
          locked = greatest(locked - deposit_record.amount, 0)
      where user_id = deposit_record.user_id
        and token = deposit_record.token
        and chain = deposit_record.chain;

    update public.wallet_deposits
      set status = 'verified'
      where id = deposit_id;
  else
    update public.wallet_balances
      set locked = greatest(locked - deposit_record.amount, 0)
      where user_id = deposit_record.user_id
        and token = deposit_record.token
        and chain = deposit_record.chain;

    update public.wallet_deposits
      set status = 'rejected'
      where id = deposit_id;
  end if;
end;
$$;

create or replace function public.admin_set_balance(
  target_user_id uuid,
  token_symbol text,
  chain_name text,
  available_amount numeric,
  locked_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_is_admin() then
    raise exception 'Not authorized';
  end if;

  insert into public.wallet_balances (user_id, token, chain, available, locked)
  values (target_user_id, token_symbol, chain_name, available_amount, locked_amount)
  on conflict (user_id, token, chain)
  do update set available = excluded.available, locked = excluded.locked;
end;
$$;

create or replace function public.admin_update_kyc(
  target_user_id uuid,
  next_status text,
  note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.user_kyc
    set status = next_status,
        review_note = note,
        updated_at = now()
    where user_id = target_user_id;

  update public.user_profiles
    set kyc_status = next_status,
        updated_at = now()
    where user_id = target_user_id;
end;
$$;

create or replace function public.admin_set_account_status(
  target_user_id uuid,
  next_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.user_profiles
    set account_status = next_status,
        updated_at = now()
    where user_id = target_user_id;
end;
$$;

create policy "KYC is viewable by owner"
  on public.user_kyc for select using (auth.uid() = user_id);

create policy "KYC is insertable by owner"
  on public.user_kyc
  for insert with check (auth.uid() = user_id and status = 'pending');

create policy "KYC is updateable by owner"
  on public.user_kyc
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status in ('pending', 'rejected'));

create policy "Transfers are viewable by participants"
  on public.p2p_transfers
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Transfers are insertable by sender"
  on public.p2p_transfers
  for insert with check (auth.uid() = sender_id);

create policy "Offers are viewable when open"
  on public.p2p_offers
  for select using (status = 'open' or auth.uid() = user_id);

create policy "Offers are insertable by owner"
  on public.p2p_offers
  for insert with check (auth.uid() = user_id);

create policy "Offers are updateable by owner"
  on public.p2p_offers
  for update using (auth.uid() = user_id);

create policy "Orders are viewable by participants"
  on public.p2p_orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Orders are insertable by participants"
  on public.p2p_orders
  for insert with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create or replace function public.create_default_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_address text;
begin
  wallet_address := '0x'
    || md5(random()::text || clock_timestamp()::text)
    || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  insert into public.wallets (user_id, address)
  values (new.id, wallet_address);
  insert into public.user_profiles (user_id, email, kyc_status)
  values (new.id, new.email, 'not_started')
  on conflict (user_id) do nothing;
  insert into public.wallet_balances (user_id, token, chain)
  values
    (new.id, 'USDT', 'Ethereum'),
    (new.id, 'USDT', 'BSC'),
    (new.id, 'USDT', 'Tron'),
    (new.id, 'USDT', 'Solana')
  on conflict do nothing;
  return new;
end;
$$;

create or replace function public.transfer_balance(
  recipient_email text,
  token_symbol text,
  chain_name text,
  amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_id uuid := auth.uid();
  recipient_id uuid;
  sender_balance numeric;
begin
  if sender_id is null then
    raise exception 'Not authenticated';
  end if;

  if amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select id into recipient_id from auth.users where email = recipient_email limit 1;
  if recipient_id is null then
    raise exception 'Recipient not found';
  end if;

  update public.wallet_balances
    set available = available - amount
    where user_id = sender_id
      and token = token_symbol
      and chain = chain_name
      and available >= amount
    returning available into sender_balance;

  if sender_balance is null then
    raise exception 'Insufficient balance';
  end if;

  insert into public.wallet_balances (user_id, token, chain, available)
  values (recipient_id, token_symbol, chain_name, amount)
  on conflict (user_id, token, chain)
  do update set available = public.wallet_balances.available + excluded.available;

  insert into public.p2p_transfers (sender_id, recipient_id, token, chain, amount)
  values (sender_id, recipient_id, token_symbol, chain_name, amount);
end;
$$;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_default_wallet();
