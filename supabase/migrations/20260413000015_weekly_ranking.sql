-- Story 4.1: RPC get_weekly_ranking — top 10 alunos com mais aulas concluídas nos últimos 7 dias
-- SECURITY DEFINER: acessa auth.users com segurança; retorna apenas dados agregados

CREATE OR REPLACE FUNCTION public.get_weekly_ranking()
RETURNS TABLE(user_name text, points bigint, is_current_user boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(p.full_name, split_part(u.email, '@', 1)) AS user_name,
    COUNT(lp.id)::bigint                               AS points,
    (lp.user_id = auth.uid())                          AS is_current_user
  FROM public.lesson_progress lp
  JOIN auth.users u ON u.id = lp.user_id
  LEFT JOIN public.profiles p ON p.user_id = lp.user_id
  WHERE lp.completed_at >= NOW() - INTERVAL '7 days'
  GROUP BY lp.user_id, p.full_name, u.email
  ORDER BY points DESC
  LIMIT 10;
$$;

-- Permitir que usuários autenticados chamem a função
GRANT EXECUTE ON FUNCTION public.get_weekly_ranking() TO authenticated;
