-- ============================================================
-- Migration: Gamificação — pontos, ranking e registro de acessos
-- Story: 14.4 — Medalhas e ranking dos alunos
-- ============================================================
-- Os pontos NÃO são gravados: são sempre calculados a partir da
-- atividade real (aulas concluídas, acessos, posts, dúvidas e
-- respostas). Assim não há saldo para o aluno adulterar e mudar
-- uma regra de pontuação não exige recalcular nada.
--
-- Regras (espelhadas em src/plataforma/lib/gamification.js):
--   aula concluída ........ 10 pontos
--   dia com acesso ........  2 pontos
--   post no fórum .........  5 pontos (até 5 por dia)
--   dúvida em aula ........  3 pontos (até 5 por dia)
--   resposta (fórum/aula) .  3 pontos (até 5 por dia)
--
-- Depende da migração 32 (papel em app_metadata) para tirar a
-- equipe do ranking. Idempotente.

-- ── 1. Dias de acesso ────────────────────────────────────────
create table if not exists public.platform_access_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  primary key (user_id, day)
);

alter table public.platform_access_days enable row level security;

-- O aluno só lê os próprios dias. Não há policy de escrita: o único
-- caminho é a função abaixo, que grava sempre "hoje" para quem chama.
drop policy if exists "acessos: usuario le os proprios" on public.platform_access_days;
create policy "acessos: usuario le os proprios"
  on public.platform_access_days for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.register_platform_access()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.platform_access_days (user_id, day)
  values (auth.uid(), (now() at time zone 'America/Sao_Paulo')::date)
  on conflict do nothing;
end
$$;

revoke all on function public.register_platform_access() from public, anon;
grant execute on function public.register_platform_access() to authenticated;

-- ── 2. Cálculo de pontos (interno) ───────────────────────────
create or replace function public.gamification_scores(p_since timestamptz default null)
returns table(
  user_id     uuid,
  lessons     bigint,
  access_days bigint,
  posts       bigint,
  questions   bigint,
  answers     bigint,
  points      bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with events as (
    select lp.user_id, 'lesson'::text as kind, lp.completed_at as at
      from public.lesson_progress lp
    union all
    select ft.user_id, 'post', ft.created_at from public.forum_topics ft
    union all
    select fr.user_id, 'answer', fr.created_at from public.forum_replies fr
    union all
    select q.user_id,
           case when q.parent_id is null then 'question' else 'answer' end,
           q.created_at
      from public.lesson_qa q
  ),
  daily as (
    select e.user_id, e.kind,
           (e.at at time zone 'America/Sao_Paulo')::date as day,
           count(*) as n
      from events e
     where p_since is null or e.at >= p_since
     group by 1, 2, 3
  ),
  capped as (
    -- Aulas contam todas; participação tem teto diário contra spam.
    select d.user_id, d.kind,
           sum(case when d.kind = 'lesson' then d.n else least(d.n, 5) end)::bigint as n
      from daily d
     group by 1, 2
  ),
  access as (
    select a.user_id, count(*)::bigint as n
      from public.platform_access_days a
     where p_since is null
        or a.day >= (p_since at time zone 'America/Sao_Paulo')::date
     group by 1
  ),
  people as (
    select c.user_id from capped c
    union
    select a.user_id from access a
  ),
  totals as (
    select p.user_id,
           coalesce((select c.n from capped c where c.user_id = p.user_id and c.kind = 'lesson'), 0)   as lessons,
           coalesce((select a.n from access a where a.user_id = p.user_id), 0)                         as access_days,
           coalesce((select c.n from capped c where c.user_id = p.user_id and c.kind = 'post'), 0)     as posts,
           coalesce((select c.n from capped c where c.user_id = p.user_id and c.kind = 'question'), 0) as questions,
           coalesce((select c.n from capped c where c.user_id = p.user_id and c.kind = 'answer'), 0)   as answers
      from people p
  )
  select t.user_id, t.lessons, t.access_days, t.posts, t.questions, t.answers,
         (t.lessons * 10 + t.access_days * 2 + t.posts * 5 + t.questions * 3 + t.answers * 3)::bigint as points
    from totals t;
$$;

-- Só as funções públicas abaixo usam o cálculo; o cliente não o chama.
revoke all on function public.gamification_scores(timestamptz) from public, anon, authenticated;

-- ── 3. Ranking ───────────────────────────────────────────────
-- p_period: 'week' (7 dias), 'month' (30 dias) ou 'all' (geral).
create or replace function public.gamification_ranked(p_period text default 'all')
returns table(
  user_id     uuid,
  user_name   text,
  rank_pos    bigint,
  points      bigint,
  lessons     bigint,
  access_days bigint,
  posts       bigint,
  questions   bigint,
  answers     bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select s.user_id,
         coalesce(nullif(trim(p.full_name), ''), split_part(u.email, '@', 1)) as user_name,
         rank() over (order by s.points desc)                                  as rank_pos,
         s.points, s.lessons, s.access_days, s.posts, s.questions, s.answers
    from public.gamification_scores(
           case p_period
             when 'week'  then now() - interval '7 days'
             when 'month' then now() - interval '30 days'
             else null
           end
         ) s
    join auth.users u on u.id = s.user_id
    left join public.profiles p on p.user_id = s.user_id
   where coalesce(u.raw_app_meta_data->>'role', '') not in ('admin', 'comercial')
     and s.points > 0;
$$;

revoke all on function public.gamification_ranked(text) from public, anon, authenticated;

create or replace function public.get_gamification_ranking(p_period text default 'all', p_limit int default 20)
returns table(
  user_name       text,
  rank_pos        bigint,
  points          bigint,
  lessons         bigint,
  is_current_user boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select r.user_name, r.rank_pos, r.points, r.lessons,
         (r.user_id = auth.uid()) as is_current_user
    from public.gamification_ranked(p_period) r
   order by r.rank_pos, r.user_name
   limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

revoke all on function public.get_gamification_ranking(text, int) from public, anon;
grant execute on function public.get_gamification_ranking(text, int) to authenticated;

-- ── 4. Resumo do próprio aluno ───────────────────────────────
-- Sempre devolve uma linha para quem chama (zeros se ainda não pontuou).
-- rank_pos é nulo para quem não aparece no ranking (sem pontos ou equipe).
create or replace function public.get_my_gamification(p_period text default 'all')
returns table(
  rank_pos     bigint,
  participants bigint,
  points       bigint,
  lessons      bigint,
  access_days  bigint,
  posts        bigint,
  questions    bigint,
  answers      bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select * from public.gamification_ranked(p_period)
  ),
  mine as (
    select * from public.gamification_scores(
      case p_period
        when 'week'  then now() - interval '7 days'
        when 'month' then now() - interval '30 days'
        else null
      end
    ) s
    where s.user_id = auth.uid()
  )
  select (select r.rank_pos from ranked r where r.user_id = auth.uid()),
         (select count(*) from ranked)::bigint,
         coalesce((select m.points from mine m), 0),
         coalesce((select m.lessons from mine m), 0),
         coalesce((select m.access_days from mine m), 0),
         coalesce((select m.posts from mine m), 0),
         coalesce((select m.questions from mine m), 0),
         coalesce((select m.answers from mine m), 0)
   where auth.uid() is not null;
$$;

revoke all on function public.get_my_gamification(text) from public, anon;
grant execute on function public.get_my_gamification(text) to authenticated;
