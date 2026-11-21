-- ============================================================
-- PEDIDOS DE MELHORIAS (bolinha de sugestões do site)
-- Rode este arquivo inteiro no Supabase > SQL Editor > New query > Run.
-- Pode rodar mais de uma vez sem problema.
-- Só o DESENVOLVEDOR (você) vê as mensagens. O outro ADM não vê.
-- ============================================================

-- 1) Tabela que guarda quem é o desenvolvedor.
--    Fica com RLS ligada e SEM nenhuma policy: ninguém mexe nela pelo site,
--    nem um ADM. Só o SQL Editor (que você controla) consegue gravar aqui.
create table if not exists dev_owner (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table dev_owner enable row level security;

-- 2) Função que o site usa para saber se quem entrou é o desenvolvedor
create or replace function is_dev() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from dev_owner where user_id = auth.uid()) $$;

-- 3) Tabela dos pedidos
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 3 and 2000),
  from_id uuid references profiles(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table feedback enable row level security;

-- Qualquer pessoa logada envia, mas só como ela mesma
drop policy if exists "enviar melhoria" on feedback;
create policy "enviar melhoria" on feedback for insert to authenticated
  with check (from_id = my_profile_id());

-- Só o desenvolvedor lê, marca como lido e apaga
drop policy if exists "dev ve melhorias" on feedback;
create policy "dev ve melhorias" on feedback for select to authenticated using (is_dev());
drop policy if exists "dev edita melhorias" on feedback;
create policy "dev edita melhorias" on feedback for update to authenticated using (is_dev()) with check (is_dev());
drop policy if exists "dev apaga melhorias" on feedback;
create policy "dev apaga melhorias" on feedback for delete to authenticated using (is_dev());

-- 4) Aviso em tempo real (o Supabase só entrega ao desenvolvedor, por causa da policy)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='feedback') then
    alter publication supabase_realtime add table feedback;
  end if;
end $$;

-- ============================================================
-- 5) ÚLTIMO PASSO: torna este e-mail o DESENVOLVEDOR (o mesmo e-mail que você usa
--    para entrar no site). Já está preenchido, é só rodar o arquivo inteiro.
-- ============================================================
insert into dev_owner (user_id)
select id from auth.users where lower(email) = lower('taylonandersondsl@gmail.com')
on conflict do nothing;
