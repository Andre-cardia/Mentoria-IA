-- ============================================================
-- Migration: Corrida Estelar — progresso de cada aluno por trilha
-- Story: 14.5 — Corrida Estelar (gamificação em 3D)
-- ============================================================
-- Cada trilha é uma galáxia; a nave do aluno avança conforme ele
-- ganha pontos. O ápice (Estrela da Certificação)
-- é alcançado ao concluir o curso marcado como certificação.
-- Depende das migrações 31 (trilhas), 32 (papéis) e 33 (pontos).
-- Idempotente.

-- ── 1. Curso de certificação ─────────────────────────────────
alter table public.modules
  add column if not exists is_certification boolean not null default false;

-- Marca o curso atual de certificação, se ainda não houver nenhum marcado.
update public.modules
   set is_certification = true
 where lower(trim(title)) = lower('Projeto de Certificação')
   and not exists (select 1 from public.modules where is_certification);

-- ── 2. Dados da corrida ──────────────────────────────────────
-- Uma linha por participante: pontos totais (ver migração 33) e se
-- concluiu a certificação. A nave avança pelos pontos — as aulas são
-- transmitidas ao vivo, então não se exige assistir a todas as gravações.
-- Devolve os p_limit com mais pontos e, sempre, quem está chamando.
-- Equipe (admin/comercial) fica de fora, exceto na própria linha.
drop function if exists public.get_star_race(int);

create function public.get_star_race(p_limit int default 30)
returns table(
  user_name       text,
  is_current_user boolean,
  points          bigint,
  certified       boolean
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
           coalesce(u.raw_app_meta_data->>'role', '') in ('admin', 'comercial') as is_staff
      from people pe
      join auth.users u on u.id = pe.user_id
      left join public.profiles p on p.user_id = pe.user_id
      left join scores s on s.user_id = pe.user_id
  ),
  ordered as (
    select r.*,
           row_number() over (order by r.certified desc, r.points desc, r.user_name) as pos
      from rows r
     where not r.is_staff or r.is_current_user
  )
  select o.user_name, o.is_current_user, o.points, o.certified
    from ordered o
   where o.is_current_user
      or o.pos <= least(greatest(coalesce(p_limit, 30), 1), 100)
   order by o.pos;
$$;

revoke all on function public.get_star_race(int) from public, anon;
grant execute on function public.get_star_race(int) to authenticated;
