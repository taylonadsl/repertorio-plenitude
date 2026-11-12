-- ============================================================
-- Repertório Banda Plenitude — rode este arquivo inteiro no
-- Supabase > SQL Editor > New query > Run
-- Pode rodar quantas vezes quiser: não apaga músicas nem perfis.
-- ============================================================

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text unique,
  avatar_url text,
  role text not null default 'singer' check (role in ('singer','admin')),
  gender text check (gender in ('f','m')),
  created_at timestamptz not null default now()
);

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  title_key text not null unique,            -- título normalizado: impede músicas duplicadas
  owner_id uuid references profiles(id) on delete cascade,
  is_emergency boolean not null default false,
  added_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((is_emergency and owner_id is null) or (not is_emergency and owner_id is not null))
);

-- Bancos criados antes desta versão: adiciona o campo de voz (cantor/cantora)
alter table profiles add column if not exists gender text check (gender in ('f','m'));

-- Funções auxiliares
create or replace function my_profile_id() returns uuid
language sql stable security definer set search_path = public as
$$ select id from profiles where user_id = auth.uid() $$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where user_id = auth.uid() and role = 'admin') $$;

-- Ao criar a conta no site: cria o perfil (ou liga a um perfil que o ADM já cadastrou pelo e-mail)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set user_id = new.id,
         avatar_url = new.raw_user_meta_data->>'avatar_url',
         gender = coalesce(new.raw_user_meta_data->>'gender', gender)
   where email = lower(new.email) and user_id is null;
  if not found then
    insert into profiles (user_id, name, email, avatar_url, gender)
    values (new.id,
            coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
            lower(new.email),
            new.raw_user_meta_data->>'avatar_url',
            new.raw_user_meta_data->>'gender');
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Segurança (RLS)
alter table profiles enable row level security;
alter table songs enable row level security;

drop policy if exists "ver perfis" on profiles;
create policy "ver perfis" on profiles for select to authenticated using (true);
drop policy if exists "adm insere perfis" on profiles;
create policy "adm insere perfis" on profiles for insert to authenticated with check (is_admin());
drop policy if exists "adm edita perfis" on profiles;
create policy "adm edita perfis" on profiles for update to authenticated using (is_admin());
drop policy if exists "adm exclui perfis" on profiles;
create policy "adm exclui perfis" on profiles for delete to authenticated using (is_admin());

drop policy if exists "ver musicas" on songs;
create policy "ver musicas" on songs for select to authenticated using (true);
drop policy if exists "inserir musicas" on songs;
create policy "inserir musicas" on songs for insert to authenticated with check (
  is_admin()
  or (owner_id = my_profile_id() and not is_emergency)
  or (is_emergency and owner_id is null)
);
drop policy if exists "editar musicas" on songs;
create policy "editar musicas" on songs for update to authenticated
  using (is_admin() or owner_id = my_profile_id())
  with check (is_admin() or owner_id = my_profile_id() or (is_emergency and owner_id is null));
drop policy if exists "excluir musicas" on songs;
create policy "excluir musicas" on songs for delete to authenticated
  using (is_admin() or owner_id = my_profile_id() or added_by = my_profile_id());

-- Atualização em tempo real
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='songs') then
    alter publication supabase_realtime add table songs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='profiles') then
    alter publication supabase_realtime add table profiles;
  end if;
end $$;

-- ============================================================
-- DEPOIS de criar a sua conta no site, rode:
-- update profiles set role = 'admin' where email = 'SEU_EMAIL';
-- ============================================================
