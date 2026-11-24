-- Story 14.9: bloquear dados privados enquanto a senha inicial estiver pendente.
-- O Auth continua acessível para login e troca de senha.

-- Preserva uma integração de PostgREST configurada fora do repositório.
do $$
begin
  if exists (
    select from pg_catalog.pg_db_role_setting s
    cross join lateral unnest(s.setconfig) as setting(value)
    where s.setdatabase in (0, (select oid from pg_catalog.pg_database where datname = current_database()))
      and s.setrole in (0, (select oid from pg_catalog.pg_roles where rolname = 'authenticator'))
      and setting.value like 'pgrst.db_pre_request=%'
      and setting.value <> 'pgrst.db_pre_request=public.enforce_first_access_password'
  ) then
    raise exception 'Integre a checagem de primeiro acesso ao hook existente de PostgREST.';
  end if;
end;
$$;

create or replace function public.first_access_password_completed()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() #> '{app_metadata,password_change_required}' <> 'true'::jsonb, true);
$$;

create or replace function public.enforce_first_access_password()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.first_access_password_completed() then
    raise insufficient_privilege using message = 'Altere sua senha para concluir o primeiro acesso.';
  end if;
end;
$$;

-- A checagem anterior à requisição também protege RPCs SECURITY DEFINER.
alter role authenticator set pgrst.db_pre_request = 'public.enforce_first_access_password';
notify pgrst, 'reload config';

-- Storage e Realtime não passam pelo PostgREST. No Storage, aplique apenas à tabela de objetos.
do $$
declare
  relation record;
begin
  for relation in
    select n.nspname as schema_name, c.relname as table_name
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where (n.nspname = 'public' or (n.nspname = 'storage' and c.relname = 'objects'))
      and c.relkind in ('r', 'p')
      and c.relrowsecurity
  loop
    execute format('drop policy if exists first_access_password_completed on %I.%I',
      relation.schema_name, relation.table_name);
    execute format(
      'create policy first_access_password_completed on %I.%I as restrictive for all to authenticated using ((select public.first_access_password_completed())) with check ((select public.first_access_password_completed()))',
      relation.schema_name, relation.table_name);
  end loop;
end;
$$;
