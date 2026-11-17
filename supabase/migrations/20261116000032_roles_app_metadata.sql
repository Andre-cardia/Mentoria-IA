-- ============================================================
-- Migration: papéis em app_metadata
-- Story: 14.2 — Separar ensino de gestão (admin + comercial)
-- ============================================================
-- Até aqui o papel (admin / comercial) ficava em user_metadata, que o
-- próprio usuário logado consegue alterar via auth.updateUser(). Esta
-- migração passa a confiar apenas em app_metadata, que só o servidor
-- (service role) altera.
--
-- ANTES DE APLICAR: confira quem tem papel hoje. Qualquer conta listada
-- aqui vira admin/comercial "de verdade" no passo 1:
--
--   select email, raw_user_meta_data->>'role' as role, created_at
--     from auth.users
--    where raw_user_meta_data->>'role' is not null
--    order by created_at;
--
-- Se houver conta que não deveria estar na lista, remova o papel dela
-- antes de rodar esta migração.
--
-- DEPOIS DE APLICAR: admins e comerciais precisam sair e entrar de novo
-- (o token antigo ainda não carrega app_metadata.role).
-- ============================================================

-- ── 1. Copia o papel atual para app_metadata ─────────────────
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                           || jsonb_build_object('role', raw_user_meta_data->>'role')
 where raw_user_meta_data->>'role' in ('admin', 'comercial')
   and coalesce(raw_app_meta_data->>'role', '') <> raw_user_meta_data->>'role';

-- ── 2. Reescreve todas as policies que leem o papel do JWT ───
-- Em vez de recriar ~40 policies à mão, troca a origem do papel
-- diretamente na expressão já instalada (public e storage).
do $$
declare
  pol record;
  new_qual text;
  new_check text;
  stmt text;
begin
  for pol in
    select schemaname, tablename, policyname, qual, with_check
      from pg_policies
     where coalesce(qual, '') like '%user_metadata%'
        or coalesce(with_check, '') like '%user_metadata%'
  loop
    new_qual  := replace(pol.qual, '''user_metadata''', '''app_metadata''');
    new_check := replace(pol.with_check, '''user_metadata''', '''app_metadata''');

    stmt := format('alter policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    if new_qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;

    execute stmt;
  end loop;
end
$$;

-- ── 3. Reescreve as funções que leem o papel ─────────────────
-- Cobre tanto o papel vindo do JWT quanto o lido de auth.users.
-- Só a chave 'role' muda; full_name/name continuam em user_metadata.
do $$
declare
  fn record;
  def text;
  new_def text;
begin
  for fn in
    select p.oid
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and (p.prosrc ~ '''user_metadata''\s*->>\s*''role'''
         or p.prosrc ~ 'raw_user_meta_data\s*->>\s*''role''')
  loop
    def := pg_get_functiondef(fn.oid);
    new_def := regexp_replace(def, '''user_metadata''(\s*->>\s*''role'')', '''app_metadata''\1', 'g');
    new_def := regexp_replace(new_def, 'raw_user_meta_data(\s*->>\s*''role'')', 'raw_app_meta_data\1', 'g');
    execute new_def;
  end loop;
end
$$;

-- ── 4. Garante que nada ficou para trás ──────────────────────
do $$
declare
  leftover_policies int;
  leftover_functions int;
begin
  select count(*) into leftover_policies
    from pg_policies
   where coalesce(qual, '') like '%user_metadata%'
      or coalesce(with_check, '') like '%user_metadata%';

  select count(*) into leftover_functions
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and (p.prosrc ~ '''user_metadata''\s*->>\s*''role'''
       or p.prosrc ~ 'raw_user_meta_data\s*->>\s*''role''');

  if leftover_policies > 0 or leftover_functions > 0 then
    raise exception 'Ainda há % policy(ies) e % função(ões) lendo o papel de user_metadata',
      leftover_policies, leftover_functions;
  end if;
end
$$;
