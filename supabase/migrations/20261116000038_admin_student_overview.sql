-- ============================================================
-- Migration: visão do admin sobre os alunos — pontos e inatividade
-- Story: 14.9 — Gestão de alunos: ordenação, avisos e inatividade
-- ============================================================
-- A tela de alunos passa a mostrar a pontuação da gamificação e a
-- destacar quem está há mais de 30 dias sem acessar a plataforma.
-- O admin pode desativar o alerta com uma observação; se o aluno voltar
-- a acessar, o alerta some sozinho e a observação deixa de valer.
-- Depende das migrações 32 e 33. Idempotente.

-- ── 1. Observações que desativam o alerta de inatividade ─────
create table if not exists public.inactivity_alert_dismissals (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  note         text not null check (length(trim(note)) > 0),
  dismissed_by uuid references auth.users(id) on delete set null,
  dismissed_at timestamptz not null default now()
);

alter table public.inactivity_alert_dismissals enable row level security;

-- Só admins leem; escrita apenas pelas funções abaixo.
drop policy if exists "inactivity_alert_dismissals: admin le" on public.inactivity_alert_dismissals;
create policy "inactivity_alert_dismissals: admin le" on public.inactivity_alert_dismissals
  for select to authenticated
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

-- ── 2. Pontos e último acesso de cada aluno ──────────────────
-- Último acesso = o sinal mais recente entre login, dia de acesso
-- registrado, aula concluída e participação no fórum ou nas dúvidas.
-- A observação só é devolvida se foi feita depois do último acesso:
-- quando o aluno volta, ela perde a validade.
--
-- inactive_since é a data a partir da qual se conta a inatividade. O
-- registro diário de acesso só existe desde 2026-11-16 (migração 33); antes
-- disso o único sinal era o login, que não muda quando o aluno entra com a
-- sessão salva. Por isso a contagem nunca começa antes dessa data — sem
-- esse piso, quase todos os alunos apareceriam como inativos no primeiro dia.
drop function if exists public.admin_student_overview();

create function public.admin_student_overview()
returns table(
  user_id            uuid,
  points             bigint,
  last_access_at     timestamptz,
  inactive_since     timestamptz,
  alert_note         text,
  alert_dismissed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;

  return query
  with activity as (
    select u.id as uid,
           greatest(
             u.last_sign_in_at,
             (select max(a.day)::timestamp at time zone 'America/Sao_Paulo'
                from public.platform_access_days a where a.user_id = u.id),
             (select max(lp.completed_at) from public.lesson_progress lp where lp.user_id = u.id),
             (select max(ft.created_at) from public.forum_topics ft where ft.user_id = u.id),
             (select max(fr.created_at) from public.forum_replies fr where fr.user_id = u.id),
             (select max(q.created_at) from public.lesson_qa q where q.user_id = u.id)
           ) as last_at
      from auth.users u
  )
  select p.user_id,
         coalesce(s.points, 0)::bigint,
         act.last_at,
         greatest(coalesce(act.last_at, p.created_at), timestamptz '2026-11-16 00:00:00-03'),
         case when d.dismissed_at >= coalesce(act.last_at, '-infinity'::timestamptz) then d.note end,
         case when d.dismissed_at >= coalesce(act.last_at, '-infinity'::timestamptz) then d.dismissed_at end
    from public.profiles p
    join activity act on act.uid = p.user_id
    left join public.gamification_scores(null) s on s.user_id = p.user_id
    left join public.inactivity_alert_dismissals d on d.user_id = p.user_id;
end
$$;

revoke all on function public.admin_student_overview() from public, anon;
grant execute on function public.admin_student_overview() to authenticated;

-- ── 3. Desativar (com observação) ou reativar o alerta ───────
-- p_note vazio ou nulo reativa o alerta.
create or replace function public.admin_set_inactivity_alert(p_user_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;
  if p_user_id is null then
    raise exception 'Aluno não informado' using errcode = '22023';
  end if;

  if coalesce(trim(p_note), '') = '' then
    delete from public.inactivity_alert_dismissals where user_id = p_user_id;
    return;
  end if;

  insert into public.inactivity_alert_dismissals (user_id, note, dismissed_by)
  values (p_user_id, trim(p_note), auth.uid())
  on conflict (user_id) do update
    set note = excluded.note, dismissed_by = excluded.dismissed_by, dismissed_at = now();
end
$$;

revoke all on function public.admin_set_inactivity_alert(uuid, text) from public, anon;
grant execute on function public.admin_set_inactivity_alert(uuid, text) to authenticated;
