-- ============================================================
-- Migration: Patentes, promoção por mérito e acessórios da nave
-- Story: 14.7 — Patentes e naves da Corrida Estelar
-- ============================================================
-- Patente do aluno (espelhada em src/plataforma/lib/starRace.js):
--   Aspirante (galáxia básica) → Primeiro Oficial (intermediária) →
--   Comandante (avançada) → Master (Projeto de Certificação).
-- A patente vem do avanço na corrida; um admin pode promover por
-- mérito até Comandante. Master só com a certificação concluída.
-- Cada módulo (curso) concluído por inteiro rende acessórios para a nave.
-- Depende das migrações 32, 33 e 34. Idempotente.

-- ── 1. Promoções por mérito ──────────────────────────────────
create table if not exists public.rank_promotions (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  rank       text not null check (rank in ('primeiro_oficial', 'comandante')),
  note       text,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now()
);

alter table public.rank_promotions enable row level security;

-- Leitura: o próprio aluno e admins. Escrita só pela função abaixo.
drop policy if exists "rank_promotions: leitura propria ou admin" on public.rank_promotions;
create policy "rank_promotions: leitura propria ou admin" on public.rank_promotions
  for select to authenticated
  using (
    user_id = auth.uid()
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- p_rank: 'primeiro_oficial' | 'comandante'; nulo ou vazio remove a promoção.
create or replace function public.admin_set_rank_promotion(
  p_user_id uuid, p_rank text, p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Apenas administradores podem promover alunos' using errcode = '42501';
  end if;
  if p_user_id is null then
    raise exception 'Aluno não informado' using errcode = '22023';
  end if;

  if coalesce(trim(p_rank), '') = '' then
    delete from public.rank_promotions where user_id = p_user_id;
    return;
  end if;
  if p_rank not in ('primeiro_oficial', 'comandante') then
    raise exception 'Patente inválida' using errcode = '22023';
  end if;

  insert into public.rank_promotions (user_id, rank, note, granted_by)
  values (p_user_id, p_rank, nullif(trim(coalesce(p_note, '')), ''), auth.uid())
  on conflict (user_id) do update
    set rank = excluded.rank, note = excluded.note,
        granted_by = excluded.granted_by, granted_at = now();
end
$$;

revoke all on function public.admin_set_rank_promotion(uuid, text, text) from public, anon;
grant execute on function public.admin_set_rank_promotion(uuid, text, text) to authenticated;

-- ── 2. Dados da corrida: módulos concluídos e promoção ───────
drop function if exists public.get_star_race(int);

create function public.get_star_race(p_limit int default 30)
returns table(
  user_name         text,
  is_current_user   boolean,
  points            bigint,
  certified         boolean,
  modules_completed bigint,
  granted_rank      text
)
language sql
stable
security definer
set search_path = public
as $$
  with cert as (
    -- Certificado = concluiu todas as aulas de um curso de certificação.
    select lp.user_id
      from public.modules m
      join public.lessons l on l.module_id = m.id
      join public.lesson_progress lp on lp.lesson_id = l.id
     where m.is_certification
     group by m.id, lp.user_id
    having count(*) = (select count(*) from public.lessons x where x.module_id = m.id)
  ),
  scores as (
    select s.user_id, s.points from public.gamification_scores(null) s
  ),
  mods as (
    -- Módulos com todas as aulas concluídas: rendem acessórios para a nave.
    select d.user_id, count(*)::bigint as n
      from (
        select lp.user_id, l.module_id
          from public.lesson_progress lp
          join public.lessons l on l.id = lp.lesson_id
         group by lp.user_id, l.module_id
        having count(*) = (select count(*) from public.lessons x where x.module_id = l.module_id)
      ) d
     group by d.user_id
  ),
  people as (
    select s.user_id from scores s where s.points > 0
    union
    select c.user_id from cert c
    union
    select auth.uid() where auth.uid() is not null
  ),
  rows as (
    select pe.user_id,
           coalesce(nullif(trim(p.full_name), ''), split_part(u.email, '@', 1)) as user_name,
           (pe.user_id = auth.uid())                                  as is_current_user,
           coalesce(s.points, 0)                                      as points,
           exists (select 1 from cert c where c.user_id = pe.user_id) as certified,
           coalesce(md.n, 0)                                          as modules_completed,
           rp.rank                                                    as granted_rank,
           coalesce(u.raw_app_meta_data->>'role', '') in ('admin', 'comercial') as is_staff
      from people pe
      join auth.users u on u.id = pe.user_id
      left join public.profiles p on p.user_id = pe.user_id
      left join scores s on s.user_id = pe.user_id
      left join mods md on md.user_id = pe.user_id
      left join public.rank_promotions rp on rp.user_id = pe.user_id
  ),
  ordered as (
    select r.*,
           row_number() over (order by r.certified desc, r.points desc, r.user_name) as pos
      from rows r
     where not r.is_staff or r.is_current_user
  )
  select o.user_name, o.is_current_user, o.points, o.certified, o.modules_completed, o.granted_rank
    from ordered o
   where o.is_current_user
      or o.pos <= least(greatest(coalesce(p_limit, 30), 1), 100)
   order by o.pos;
$$;

revoke all on function public.get_star_race(int) from public, anon;
grant execute on function public.get_star_race(int) to authenticated;
