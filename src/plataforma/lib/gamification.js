// Regras de pontuação. Espelham a função gamification_scores do banco
// (supabase/migrations/20261116000035_quiz_points.sql): se mudar aqui, mude lá.
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

export const EMPTY_STATS = { lessons: 0, access_days: 0, posts: 0, questions: 0, answers: 0, quizzes: 0, points: 0 };

// Insígnias de missão. `glyph` é o símbolo em traço (ver StellarGlyph.jsx)
// e `tier` o grau dentro da mesma série.
export const BADGES = [
  { id: 'aula-1',      glyph: 'trajectory', tier: 'I',   title: 'Decolagem',         metric: 'lessons',     target: 1,   description: 'Conclua sua primeira aula' },
  { id: 'aula-10',     glyph: 'trajectory', tier: 'II',  title: 'Em órbita',         metric: 'lessons',     target: 10,  description: 'Conclua 10 aulas' },
  { id: 'aula-25',     glyph: 'trajectory', tier: 'III', title: 'Velocidade de cruzeiro', metric: 'lessons', target: 25, description: 'Conclua 25 aulas' },
  { id: 'aula-50',     glyph: 'trajectory', tier: 'IV',  title: 'Espaço profundo',   metric: 'lessons',     target: 50,  description: 'Conclua 50 aulas' },
  { id: 'aula-100',    glyph: 'trajectory', tier: 'V',   title: 'Veterano',          metric: 'lessons',     target: 100, description: 'Conclua 100 aulas' },
  { id: 'acesso-7',    glyph: 'orbit',      tier: 'I',   title: 'Presença',          metric: 'access_days', target: 7,   description: 'Acesse a plataforma em 7 dias' },
  { id: 'acesso-30',   glyph: 'orbit',      tier: 'II',  title: 'Órbita estável',    metric: 'access_days', target: 30,  description: 'Acesse a plataforma em 30 dias' },
  { id: 'acesso-100',  glyph: 'orbit',      tier: 'III', title: 'Residente',         metric: 'access_days', target: 100, description: 'Acesse a plataforma em 100 dias' },
  { id: 'post-1',      glyph: 'signal',     tier: 'I',   title: 'Primeiro sinal',    metric: 'posts',       target: 1,   description: 'Publique seu primeiro post no fórum' },
  { id: 'post-10',     glyph: 'signal',     tier: 'II',  title: 'Transmissão',       metric: 'posts',       target: 10,  description: 'Publique 10 posts no fórum' },
  { id: 'duvida-1',    glyph: 'scan',       tier: 'I',   title: 'Sondagem',          metric: 'questions',   target: 1,   description: 'Envie sua primeira dúvida em uma aula' },
  { id: 'duvida-10',   glyph: 'scan',       tier: 'II',  title: 'Exploração',        metric: 'questions',   target: 10,  description: 'Envie 10 dúvidas em aulas' },
  { id: 'resposta-1',  glyph: 'link',       tier: 'I',   title: 'Apoio de solo',     metric: 'answers',     target: 1,   description: 'Responda um colega pela primeira vez' },
  { id: 'resposta-10', glyph: 'link',       tier: 'II',  title: 'Controle de missão', metric: 'answers',    target: 10,  description: 'Responda 10 vezes no fórum ou nas aulas' },
  { id: 'resposta-50', glyph: 'link',       tier: 'III', title: 'Diretor de voo',    metric: 'answers',     target: 50,  description: 'Responda 50 vezes no fórum ou nas aulas' },
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
