-- Run this in your Supabase SQL editor
-- Project: brain dashboard

-- Vault search index
create table if not exists vault_index (
  id uuid primary key default gen_random_uuid(),
  path text unique not null,
  title text not null,
  body text not null default '',
  tags text[] not null default '{}',
  frontmatter jsonb not null default '{}',
  indexed_at timestamptz not null default now()
);

-- Full-text search index
create index if not exists vault_index_fts
  on vault_index using gin(to_tsvector('english', body));

-- Agent activity log
create table if not exists agent_log (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  action text not null,
  note_path text,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists agent_log_created_at
  on agent_log (created_at desc);

-- RLS: allow anon read on both tables (dashboard is read-only from browser)
alter table vault_index enable row level security;
alter table agent_log enable row level security;

create policy "anon read vault_index"
  on vault_index for select to anon using (true);

create policy "anon read agent_log"
  on agent_log for select to anon using (true);

-- Service-role writes (used by indexer + agent webhook)
create policy "service write vault_index"
  on vault_index for all to service_role using (true);

create policy "service write agent_log"
  on agent_log for all to service_role using (true);
