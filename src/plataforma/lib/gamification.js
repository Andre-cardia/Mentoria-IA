// Regras de pontuação. Espelham a função gamification_scores do banco
// (supabase/migrations/20261116000033_gamification.sql): se mudar aqui, mude lá.
export const POINT_RULES = [
  { metric: 'lessons',     label: 'Aula concluída',            points: 10 },
  { metric: 'posts',       label: 'Post no fórum',             points: 5, dailyCap: 5 },
  { metric: 'questions',   label: 'Dúvida em uma aula',        points: 3, dailyCap: 5 },
  { metric: 'answers',     label: 'Resposta (fórum ou aula)',  points: 3, dailyCap: 5 },
  { metric: 'access_days', label: 'Dia com acesso',            points: 2 },
];

export const RANKING_PERIODS = [
  { id: 'week',  label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'all',   label: 'Geral' },
];

export const EMPTY_STATS = { lessons: 0, access_days: 0, posts: 0, questions: 0, answers: 0, points: 0 };

export const BADGES = [
  { id: 'aula-1',     icon: '🚀', title: 'Primeiro passo',   metric: 'lessons',     target: 1,   description: 'Conclua sua primeira aula' },
  { id: 'aula-10',    icon: '📚', title: 'Ritmo de estudo',  metric: 'lessons',     target: 10,  description: 'Conclua 10 aulas' },
  { id: 'aula-25',    icon: '🔥', title: 'Dedicação',        metric: 'lessons',     target: 25,  description: 'Conclua 25 aulas' },
  { id: 'aula-50',    icon: '🏅', title: 'Maratonista',      metric: 'lessons',     target: 50,  description: 'Conclua 50 aulas' },
  { id: 'aula-100',   icon: '🏆', title: 'Centurião',        metric: 'lessons',     target: 100, description: 'Conclua 100 aulas' },
  { id: 'acesso-7',   icon: '📅', title: 'Presença',         metric: 'access_days', target: 7,   description: 'Acesse a plataforma em 7 dias' },
  { id: 'acesso-30',  icon: '🗓️', title: 'Hábito formado',   metric: 'access_days', target: 30,  description: 'Acesse a plataforma em 30 dias' },
  { id: 'acesso-100', icon: '💎', title: 'Sempre por aqui',  metric: 'access_days', target: 100, description: 'Acesse a plataforma em 100 dias' },
  { id: 'post-1',     icon: '💬', title: 'Voz ativa',        metric: 'posts',       target: 1,   description: 'Publique seu primeiro post no fórum' },
  { id: 'post-10',    icon: '📣', title: 'Puxa conversa',    metric: 'posts',       target: 10,  description: 'Publique 10 posts no fórum' },
  { id: 'duvida-1',   icon: '❓', title: 'Curiosidade',      metric: 'questions',   target: 1,   description: 'Envie sua primeira dúvida em uma aula' },
  { id: 'duvida-10',  icon: '🔎', title: 'Investigador',     metric: 'questions',   target: 10,  description: 'Envie 10 dúvidas em aulas' },
  { id: 'resposta-1', icon: '🤝', title: 'Mão amiga',        metric: 'answers',     target: 1,   description: 'Responda um colega pela primeira vez' },
  { id: 'resposta-10', icon: '🧭', title: 'Referência',      metric: 'answers',     target: 10,  description: 'Responda 10 vezes no fórum ou nas aulas' },
  { id: 'resposta-50', icon: '🌟', title: 'Mentor da turma', metric: 'answers',     target: 50,  description: 'Responda 50 vezes no fórum ou nas aulas' },
];

function toCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Normaliza a linha vinda do banco (bigint pode chegar como string). */
export function normalizeStats(row) {
  const stats = { ...EMPTY_STATS };
  for (const key of Object.keys(EMPTY_STATS)) stats[key] = toCount(row?.[key]);
  return stats;
}

/**
 * Situação de cada medalha para os números do aluno.
 * @returns {Array<typeof BADGES[number] & { earned: boolean, current: number, pct: number }>}
 */
export function computeBadges(stats) {
  const safe = normalizeStats(stats);
  return BADGES.map((badge) => {
    const current = Math.min(safe[badge.metric], badge.target);
    return {
      ...badge,
      current,
      earned: safe[badge.metric] >= badge.target,
      pct: Math.round((current / badge.target) * 100),
    };
  });
}

/** Medalha ainda não conquistada mais próxima de ser alcançada. */
export function nextBadge(stats) {
  const pending = computeBadges(stats).filter((badge) => !badge.earned);
  if (pending.length === 0) return null;
  return pending.reduce((best, badge) => (badge.pct > best.pct ? badge : best));
}

export function formatPoints(points) {
  const n = toCount(points);
  return `${n.toLocaleString('pt-BR')} pt${n === 1 ? '' : 's'}`;
}
