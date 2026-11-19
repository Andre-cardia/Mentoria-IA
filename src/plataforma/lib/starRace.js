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

// Patentes concedidas por um admin que liberam etapas da corrida.
const ADVANCED_RANKS = ['comandante', 'master'];

/**
 * Onde a nave está. Os pontos preenchem as galáxias em sequência:
 * `fractions` é o avanço em cada uma (0 a 1), `earned` os pontos gastos nela,
 * `u` a posição na rota e `galaxyIndex` a galáxia atual (3 = ápice).
 *
 * A Galáxia Avançada e o ápice dependem do aval de um admin (`granted_rank`):
 * sem 'comandante' a nave para na fronteira da Avançada (`awaitingAdvanced`);
 * só com 'master' ela chega à Estrela da Certificação (`certified`).
 */
export function racePosition(racer, totals) {
  const goals = galaxyGoals(totals);
  const granted = racer?.granted_rank ?? null;
  const advancedUnlocked = ADVANCED_RANKS.includes(granted);
  const certified = granted === 'master';
  const projectDone = Boolean(racer?.certified);

  let remaining = toCount(racer?.points);
  const earned = goals.map((goal, index) => {
    if (index === GALAXIES.length - 1 && !advancedUnlocked) return 0;
    const used = Math.min(remaining, goal);
    remaining -= used;
    return used;
  });
  const fractions = earned.map((used, index) => used / goals[index]);
  const traveled = fractions.reduce((sum, f) => sum + f, 0);
  const awaitingAdvanced = !advancedUnlocked && traveled >= GALAXIES.length - 1;
  const awaitingMaster = !certified && (projectDone || traveled >= GALAXIES.length);
  const flags = { advancedUnlocked, awaitingAdvanced, awaitingMaster, projectDone };

  if (certified) {
    return { fractions, earned, goals, traveled, certified, ...flags, u: APEX_U, galaxyIndex: GALAXIES.length, pct: 100 };
  }

  // Sem o aval a nave para na borda: da Avançada (sem Comandante) ou da última galáxia (sem Master).
  const u = ROUTE_START + traveled * GALAXY_SPAN;
  const lastOpen = advancedUnlocked ? GALAXIES.length - 1 : GALAXIES.length - 2;
  const galaxyIndex = Math.min(Math.floor(traveled), lastOpen);
  // 99% no máximo: os 100% ficam reservados para quem chegou ao ápice.
  const pct = Math.min(Math.round((traveled / GALAXIES.length) * 100), 99);
  return { fractions, earned, goals, traveled, certified, ...flags, u, galaxyIndex, pct };
}

export function positionLabel(position) {
  if (position.certified) return `Chegou à ${APEX_NAME}`;
  if (position.awaitingAdvanced) {
    return 'Concluiu a Galáxia Intermediária — aguardando o aval de um administrador para entrar na Avançada';
  }
  if (position.traveled >= GALAXIES.length) {
    return position.projectDone
      ? 'Projeto de Certificação entregue — aguardando o aval de um administrador'
      : 'Atravessou as três galáxias — falta o Projeto de Certificação';
  }
  const galaxy = GALAXIES[position.galaxyIndex];
  const within = Math.round(position.fractions[position.galaxyIndex] * 100);
  if (position.traveled === 0) return `Na largada, rumo à ${galaxy.name}`;
  return `Na ${galaxy.name} — ${within}% percorrida`;
}

// Patentes: uma por galáxia, e Master para quem conclui a certificação.
// `stars` é a insígnia; `shipClass` define o modelo da nave na corrida.
// O id 'aspirante' é o nome antigo do Cadete e segue assim no banco.
// `badge` e `ship` apontam para os badges renderizados no Blender
// (scripts/badges/gerar_badges.py), exibidos ao lado do nome no ranking.
const BADGE_DIR = '/zero-to-hero/badges/mini';

export const RANKS = [
  { id: 'aspirante',        name: 'Cadete',           stars: 1, shipClass: 1, shipName: 'Lançador orbital',
    badge: `${BADGE_DIR}/cadete.webp`,           ship: { name: 'Falcon 9',     badge: `${BADGE_DIR}/nave-falcon-9.webp` } },
  { id: 'primeiro_oficial', name: 'Primeiro Oficial', stars: 2, shipClass: 2, shipName: 'Lançador pesado',
    badge: `${BADGE_DIR}/primeiro-oficial.webp`, ship: { name: 'Falcon Heavy', badge: `${BADGE_DIR}/nave-falcon-heavy.webp` } },
  { id: 'comandante',       name: 'Comandante',       stars: 3, shipClass: 3, shipName: 'Nave interplanetária',
    badge: `${BADGE_DIR}/comandante.webp`,       ship: { name: 'Crew Dragon',  badge: `${BADGE_DIR}/nave-crew-dragon.webp` } },
  { id: 'master',           name: 'Master',           stars: 4, shipClass: 4, shipName: 'Nave completa com propulsor',
    badge: `${BADGE_DIR}/master.webp`,           ship: { name: 'Starship',     badge: `${BADGE_DIR}/nave-starship.webp` } },
];

// Patentes que um admin concede. Comandante e Master só existem com esse aval.
export const GRANTABLE_RANKS = RANKS.filter((rank) => rank.id !== 'aspirante');

/**
 * Patente do aluno. Cadete e Primeiro Oficial vêm dos pontos; Comandante
 * e Master, só do aval de um admin. `promoted` indica promoção por mérito:
 * a patente concedida está acima do que os pontos dariam.
 */
export function rankFor(position, grantedRank = null) {
  const earnedIndex = Math.min(Math.floor(toCount(position?.traveled)), 1);
  const grantedIndex = GRANTABLE_RANKS.some((rank) => rank.id === grantedRank)
    ? RANKS.findIndex((rank) => rank.id === grantedRank)
    : -1;
  const index = Math.max(earnedIndex, grantedIndex);
  const promoted = grantedIndex > earnedIndex && grantedIndex < 3 && toCount(position?.traveled) < grantedIndex;
  return { ...RANKS[index], promoted };
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

/**
 * Patente de uma linha do ranking de pontuação (get_gamification_ranking).
 * Usa os pontos de todo o tempo, não os do período exibido. Devolve null
 * quando o banco ainda não envia `total_points` (migração 39 não aplicada).
 */
export function rankForRankingRow(row, totals) {
  if (row?.total_points === undefined || row?.total_points === null) return null;
  const racer = { points: row.total_points, certified: row.certified, granted_rank: row.granted_rank ?? null };
  return rankFor(racePosition(racer, totals), racer.granted_rank);
}

// Versão em alta (1024 px, fundo transparente) de um badge, para download.
function fullBadge(path) {
  return path.replace('/mini/', '/').replace(/\.webp$/, '.png');
}

function slugOf(path) {
  return path.split('/').pop().replace(/\.webp$/, '');
}

/**
 * Badges de patente e nave para baixar: todos os da carreira, na ordem,
 * com `earned` indicando os que o aluno já conquistou (até a patente atual).
 */
export function badgeDownloads(rank) {
  const reached = rank ? RANKS.findIndex((item) => item.id === rank.id) : -1;
  return RANKS.flatMap((item, index) => {
    const earned = index <= reached;
    return [
      { key: item.id, kind: 'Patente', name: item.name, preview: item.badge, earned },
      { key: `${item.id}-nave`, kind: 'Nave', name: item.ship.name, preview: item.ship.badge, earned },
    ].map((entry) => ({
      ...entry,
      href: fullBadge(entry.preview),
      filename: `zero-to-hero-${slugOf(entry.preview)}.png`,
    }));
  });
}
