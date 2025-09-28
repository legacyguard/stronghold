-- Enable required extensions
create extension if not exists "pgcrypto";

-- Trigger function to update updated_at timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Task 1: Create documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  document_type text not null default 'General',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to keep updated_at current
drop trigger if exists trg_documents_set_updated_at on public.documents;
create trigger trg_documents_set_updated_at
before update on public.documents
for each row execute function public.update_updated_at_column();

-- Task 2: RLS and policies for documents
alter table public.documents enable row level security;

create policy "Users can view their own documents"
on public.documents
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own documents"
on public.documents
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own documents"
on public.documents
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
on public.documents
for delete
to authenticated
using (auth.uid() = user_id);

-- Task 3: Create guardians table
create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  relationship text,
  created_at timestamptz not null default now(),
  unique (user_id, email)
);

-- Task 4: RLS and policies for guardians
alter table public.guardians enable row level security;

create policy "Users can manage their own guardians - select"
on public.guardians
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can manage their own guardians - insert"
on public.guardians
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can manage their own guardians - update"
on public.guardians
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own guardians - delete"
on public.guardians
for delete
to authenticated
using (auth.uid() = user_id);


