
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration provided by user
const SUPABASE_URL = 'https://ofgehyfgwewmmqqfcies.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ2VoeWZnd2V3bW1xcWZjaWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDEwMzQsImV4cCI6MjA4MDg3NzAzNH0.Oa85Xs0a5Dtih02TSe14CCq8ZtzblJLpni6YWCvkJZ8';

let supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabase) return supabase;

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  } catch (e) {
    console.error("Invalid Supabase config", e);
    return null;
  }
};

export const isBackendConfigured = (): boolean => {
  // Always true now that we have hardcoded keys
  return true;
};

export const SQL_SETUP_INSTRUCTIONS = `
-- Run this SQL in your Supabase SQL Editor to setup the database
-- This script is safe to run multiple times (it updates existing policies).

-- 1. Create Tables
create table if not exists public.todos (
  id text primary key,
  user_id uuid references auth.users not null,
  text text,
  completed boolean,
  category text,
  due_date text,
  completed_at text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.files (
  id text primary key,
  user_id uuid references auth.users not null,
  name text,
  type text,
  size bigint,
  upload_date text,
  content_base64 text
);

create table if not exists public.user_progress (
  user_id uuid references auth.users primary key,
  xp bigint default 0,
  completed_reports jsonb default '[]'::jsonb
);

-- 2. Enable Row Level Security (RLS)
alter table public.todos enable row level security;
alter table public.files enable row level security;
alter table public.user_progress enable row level security;

-- 3. Create Policies (Drop first to avoid "already exists" errors)

-- Todos Policies
drop policy if exists "Users can manage their own todos" on public.todos;
create policy "Users can manage their own todos" on public.todos for all using (auth.uid() = user_id);

-- Files Policies
drop policy if exists "Users can manage their own files" on public.files;
create policy "Users can manage their own files" on public.files for all using (auth.uid() = user_id);

-- Progress Policies
drop policy if exists "Users can manage their own progress" on public.user_progress;
create policy "Users can manage their own progress" on public.user_progress for all using (auth.uid() = user_id);

-- 4. Storage Bucket Setup
insert into storage.buckets (id, name, public) values ('azubidocument', 'azubidocument', false)
on conflict (id) do nothing;

-- Storage Policies (Drop first to avoid errors)
drop policy if exists "Authenticated users can upload files" on storage.objects;
create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'azubidocument' and auth.uid() = (storage.foldername(name))[1]::uuid );

drop policy if exists "Authenticated users can update files" on storage.objects;
create policy "Authenticated users can update files"
on storage.objects for update
to authenticated
using ( bucket_id = 'azubidocument' and auth.uid() = (storage.foldername(name))[1]::uuid );

drop policy if exists "Authenticated users can read files" on storage.objects;
create policy "Authenticated users can read files"
on storage.objects for select
to authenticated
using ( bucket_id = 'azubidocument' and auth.uid() = (storage.foldername(name))[1]::uuid );

drop policy if exists "Authenticated users can delete files" on storage.objects;
create policy "Authenticated users can delete files"
on storage.objects for delete
to authenticated
using ( bucket_id = 'azubidocument' and auth.uid() = (storage.foldername(name))[1]::uuid );
`;
