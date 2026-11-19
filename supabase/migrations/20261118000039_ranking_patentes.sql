-- ============================================================
-- Migration: patente no ranking de pontuação
-- ============================================================
-- A lista de classificação passa a exibir, ao lado de cada nome, os
-- badges da patente e da nave do aluno. A patente não depende do período
-- do ranking: vem dos pontos de todo o tempo e do aval do admin
-- (rank_promotions), pela mesma regra de src/plataforma/lib/starRace.js.
-- Por isso o ranking passa a devolver também:
--   total_points  pontos de todo o tempo;
--   certified     concluiu as aulas do Projeto de Certificação;
--   granted_rank  patente concedida por um admin (ou nulo).
-- Depende das migrações 33, 35 e 37. Idempotente.

drop function if exists public.get_gamification_ranking(text, int);

create function public.get_gamification_ranking(p_period text default 'all', p_limit int default 20)
returns table(
  user_name       text,
  rank_pos        bigint,
  points          bigint,
  lessons         bigint,
  is_current_user boolean,
  total_points    bigint,
  certified       boolean,
  granted_rank    text
)
language sql
stable
security definer
set search_path = public
as $$
  with cert as (
    select distinct lp.user_id
      from public.modules m
      join public.lessons l on l.module_id = m.id
      join public.lesson_progress lp on lp.lesson_id = l.id
     where m.is_certification
     group by m.id, lp.user_id
    having count(*) = (select count(*) from public.lessons x where x.module_id = m.id)
  ),
  total as (
    select s.user_id, s.points from public.gamification_scores(null) s
  )
  select r.user_name, r.rank_pos, r.points, r.lessons,
         (r.user_id = auth.uid())                                  as is_current_user,
         coalesce(t.points, 0)::bigint                             as total_points,
         exists (select 1 from cert c where c.user_id = r.user_id) as certified,
         rp.rank                                                   as granted_rank
    from public.gamification_ranked(p_period) r
    left join total t on t.user_id = r.user_id
    left join public.rank_promotions rp on rp.user_id = r.user_id
   order by r.rank_pos, r.user_name
   limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

revoke all on function public.get_gamification_ranking(text, int) from public, anon;
grant execute on function public.get_gamification_ranking(text, int) to authenticated;
