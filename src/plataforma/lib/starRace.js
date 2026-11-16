// Corrida Estelar: cada trilha é uma galáxia e a nave do aluno avança
// conforme ele ganha pontos. O ápice é a Estrela da Certificação.

export const GALAXIES = [
  { level: 'basico',        name: 'Galáxia Básica',        color: '#38bdf8' },
  { level: 'intermediario', name: 'Galáxia Intermediária', color: '#a78bfa' },
  { level: 'avancado',      name: 'Galáxia Avançada',      color: '#ff8a3d' },
];

export const APEX_NAME = 'Estrela da Certificação';

// Posições na rota (0 = largada, 1 = fim). Cada galáxia ocupa um quarto da
// rota, centrada em 0,25 / 0,50 / 0,75; o ápice fica depois da última.
const ROUTE_START = 0.125;
const GALAXY_SPAN = 0.25;
export const APEX_U = 0.96;

export function galaxyCenterU(index) {
  return ROUTE_START + GALAXY_SPAN * (index + 0.5);
}

function toCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Total de aulas por nível, a partir de `tracks` com `modules(lessons(id))`.
 * @param {Array<{ level?: string, modules?: Array<{ lessons?: unknown[] }> }>} tracks
 */
export function levelTotals(tracks = []) {
  const totals = { basico: 0, intermediario: 0, avancado: 0 };
  for (const track of tracks ?? []) {
    if (!(track?.level in totals)) continue;
    for (const mod of track.modules ?? []) totals[track.level] += (mod.lessons ?? []).length;
  }
  return totals;
}

// Pontos de uma aula concluída (ver lib/gamification.js) e a fatia deles que
// cada galáxia pede. As aulas são transmitidas ao vivo, então ninguém precisa
// assistir a todas as gravações: participar também move a nave.
const LESSON_POINTS = 10;
export const GALAXY_SHARE = 0.6;

/** Pontos necessários para atravessar cada galáxia, na ordem de GALAXIES. */
export function galaxyGoals(totals) {
  return GALAXIES.map(({ level }) =>
    Math.max(LESSON_POINTS, Math.round(toCount(totals?.[level]) * LESSON_POINTS * GALAXY_SHARE)));
}

/**
 * Onde a nave está. Os pontos preenchem as galáxias em sequência:
 * `fractions` é o avanço em cada uma (0 a 1), `earned` os pontos gastos nela,
 * `u` a posição na rota e `galaxyIndex` a galáxia atual (3 = ápice).
 */
export function racePosition(racer, totals) {
  const goals = galaxyGoals(totals);
  let remaining = toCount(racer?.points);
  const earned = goals.map((goal) => {
    const used = Math.min(remaining, goal);
    remaining -= used;
    return used;
  });
  const fractions = earned.map((used, index) => used / goals[index]);
  const traveled = fractions.reduce((sum, f) => sum + f, 0);
  const certified = Boolean(racer?.certified);

  if (certified) {
    return { fractions, earned, goals, traveled, certified, u: APEX_U, galaxyIndex: GALAXIES.length, pct: 100 };
  }

  // Sem a certificação a nave para na borda da última galáxia.
  const u = ROUTE_START + traveled * GALAXY_SPAN;
  const galaxyIndex = Math.min(Math.floor(traveled), GALAXIES.length - 1);
  // 99% no máximo: os 100% ficam reservados para quem chegou ao ápice.
  const pct = Math.min(Math.round((traveled / GALAXIES.length) * 100), 99);
  return { fractions, earned, goals, traveled, certified, u, galaxyIndex, pct };
}

export function positionLabel(position) {
  if (position.certified) return `Chegou à ${APEX_NAME}`;
  const galaxy = GALAXIES[position.galaxyIndex];
  const within = Math.round(position.fractions[position.galaxyIndex] * 100);
  if (position.traveled === 0) return `Na largada, rumo à ${galaxy.name}`;
  if (position.traveled >= GALAXIES.length) return `Atravessou as três galáxias — falta o Projeto de Certificação`;
  return `Na ${galaxy.name} — ${within}% percorrida`;
}

// Patentes: uma por galáxia, e Master para quem conclui a certificação.
// `stars` é a insígnia; `shipClass` define o modelo da nave na corrida.
export const RANKS = [
  { id: 'aspirante',        name: 'Aspirante',        stars: 1, shipClass: 1, shipName: 'Lançador orbital' },
  { id: 'primeiro_oficial', name: 'Primeiro Oficial', stars: 2, shipClass: 2, shipName: 'Lançador pesado' },
  { id: 'comandante',       name: 'Comandante',       stars: 3, shipClass: 3, shipName: 'Nave interplanetária' },
  { id: 'master',           name: 'Master',           stars: 4, shipClass: 4, shipName: 'Nave completa com propulsor' },
];

// Patentes que um admin pode conceder por mérito. Master só com a certificação.
export const GRANTABLE_RANKS = RANKS.filter((rank) => rank.id === 'primeiro_oficial' || rank.id === 'comandante');

/**
 * Patente do aluno: a maior entre a conquistada na rota e a concedida por
 * mérito. `promoted` indica que a promoção por mérito está valendo.
 */
export function rankFor(position, grantedRank = null) {
  const earnedIndex = position?.certified
    ? 3
    : Math.min(Math.floor(toCount(position?.traveled)), 2);
  const grantedIndex = GRANTABLE_RANKS.some((rank) => rank.id === grantedRank)
    ? RANKS.findIndex((rank) => rank.id === grantedRank)
    : -1;
  const index = Math.max(earnedIndex, grantedIndex);
  return { ...RANKS[index], promoted: grantedIndex > earnedIndex };
}

/** "Maria Clara Souza" → "Maria S." — cabe na etiqueta da nave. */
export function shortName(fullName) {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Aluno';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** Junta os dados do banco com a posição de cada nave. */
export function buildRacers(rows = [], totals) {
  return (rows ?? []).map((row, index) => {
    const position = racePosition(row, totals);
    return {
      id: index,
      name: shortName(row.user_name),
      isCurrentUser: Boolean(row.is_current_user),
      points: toCount(row.points),
      modulesCompleted: Math.floor(toCount(row.modules_completed)),
      position,
      rank: rankFor(position, row.granted_rank),
    };
  });
}
