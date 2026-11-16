-- ============================================================
-- Migration: Quiz vale pontos — correção no servidor
-- Story: 14.6 — Perguntas de fim de módulo valendo pontos
-- ============================================================
-- Até aqui a nota do quiz era calculada no navegador e gravada pelo
-- próprio aluno (policy de INSERT em quiz_attempts), então dava para
-- gravar qualquer nota. Como o quiz passa a valer pontos na Corrida
-- Estelar, a correção vai para o servidor e o INSERT direto é fechado.
--
-- Regra: quiz aprovado (nota >= 70) vale 20 pontos, uma vez por quiz.
-- Espelhada em src/plataforma/lib/gamification.js.
-- Depende da migração 33. Idempotente.

-- ── 1. Correção no servidor ──────────────────────────────────
-- p_answers: { "<id da questão>": "<id da opção escolhida>", ... }
create or replace function public.submit_quiz_attempt(p_lesson_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_total     int;
  v_correct   int;
  v_score     int;
  v_map       jsonb;
  v_attempt   public.quiz_attempts%rowtype;
  v_had_pass  boolean;
begin
  if v_user is null then
    raise exception 'Usuário não autenticado' using errcode = '42501';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Respostas inválidas' using errcode = '22023';
  end if;

  select count(*) into v_total
    from public.quiz_questions q
   where q.lesson_id = p_lesson_id;

  if v_total = 0 then
    raise exception 'Este quiz ainda não tem questões' using errcode = '22023';
  end if;

  -- Uma opção correta por questão (a primeira, se houver mais de uma marcada).
  select coalesce(jsonb_object_agg(q.id::text, c.id::text), '{}'::jsonb),
         count(*) filter (where p_answers->>(q.id::text) = c.id::text)
    into v_map, v_correct
    from public.quiz_questions q
    join lateral (
      select o.id
        from public.quiz_options o
       where o.question_id = q.id and o.is_correct
       order by o."order", o.id
       limit 1
    ) c on true
   where q.lesson_id = p_lesson_id;

  v_score := round(v_correct * 100.0 / v_total);

  select exists (
    select 1 from public.quiz_attempts a
     where a.user_id = v_user and a.lesson_id = p_lesson_id and a.score >= 70
  ) into v_had_pass;

  insert into public.quiz_attempts (lesson_id, user_id, score, answers)
  values (p_lesson_id, v_user, v_score, p_answers)
  returning * into v_attempt;

  return jsonb_build_object(
    'id',           v_attempt.id,
    'score',        v_score,
    'correct',      v_correct,
    'total',        v_total,
    'correct_map',  v_map,
    'completed_at', v_attempt.completed_at,
    -- Pontos só na primeira aprovação de cada quiz.
    'points_earned', case when v_score >= 70 and not v_had_pass then 20 else 0 end
  );
end
$$;

revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;

-- O aluno não grava mais tentativas direto na tabela: só pela função acima.
drop policy if exists "quiz_attempts: aluno insere propria" on public.quiz_attempts;

-- ── 2. Pontos: inclui quizzes aprovados ──────────────────────
-- Os tipos de retorno mudam (nova coluna quizzes), então as funções
-- são recriadas. As demais funções da migração 33/34 só leem colunas
-- que continuam existindo.
drop function if exists public.get_my_gamification(text);
drop function if exists public.gamification_scores(timestamptz);

create function public.gamification_scores(p_since timestamptz default null)
returns table(
  user_id     uuid,
  lessons     bigint,
  access_days bigint,
  posts       bigint,
  questions   bigint,
  answers     bigint,
  quizzes     bigint,
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
  quiz as (
    -- Um quiz conta uma vez, na data da primeira aprovação.
    select fp.user_id, count(*)::bigint as n
      from (
        select qa.user_id, qa.lesson_id, min(qa.completed_at) as at
          from public.quiz_attempts qa
         where qa.score >= 70
         group by 1, 2
      ) fp
     where p_since is null or fp.at >= p_since
     group by 1
  ),
  people as (
    select c.user_id from capped c
    union
    select a.user_id from access a
    union
    select z.user_id from quiz z
  ),
  totals as (
    select p.user_id,
           coalesce((select c.n from capped c where c.user_id = p.user_id and c.kind = 'lesson'), 0)   as lessons,
           coalesce((select a.n from access a where a.user_id = p.user_id), 0)                         as access_days,
           coalesce((select c.n from capped c where c.user_id = p.user_id and c.kind = 'post'), 0)     as posts,
           coalesce((select c.n from capped c where c.user_id = p.user_id and c.kind = 'question'), 0) as questions,
           coalesce((select c.n from capped c where c.user_id = p.user_id and c.kind = 'answer'), 0)   as answers,
           coalesce((select z.n from quiz z where z.user_id = p.user_id), 0)                           as quizzes
      from people p
  )
  select t.user_id, t.lessons, t.access_days, t.posts, t.questions, t.answers, t.quizzes,
         (t.lessons * 10 + t.access_days * 2 + t.posts * 5 + t.questions * 3 + t.answers * 3 + t.quizzes * 20)::bigint as points
    from totals t;
$$;

revoke all on function public.gamification_scores(timestamptz) from public, anon, authenticated;

create function public.get_my_gamification(p_period text default 'all')
returns table(
  rank_pos     bigint,
  participants bigint,
  points       bigint,
  lessons      bigint,
  access_days  bigint,
  posts        bigint,
  questions    bigint,
  answers      bigint,
  quizzes      bigint
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
         coalesce((select m.answers from mine m), 0),
         coalesce((select m.quizzes from mine m), 0)
   where auth.uid() is not null;
$$;

revoke all on function public.get_my_gamification(text) from public, anon;
grant execute on function public.get_my_gamification(text) to authenticated;
