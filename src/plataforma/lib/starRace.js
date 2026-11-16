// Corrida Estelar: cada trilha é uma galáxia e a nave do aluno avança
// conforme ele conclui as aulas. O ápice é a Estrela da Certificação.

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

/**
 * Onde a nave está. `fractions` é o avanço em cada galáxia (0 a 1),
 * `u` a posição na rota e `galaxyIndex` a galáxia atual (3 = ápice).
 */
export function racePosition(racer, totals) {
  const fractions = GALAXIES.map(({ level }) => {
    const total = toCount(totals?.[level]);
    if (total === 0) return 0;
    return Math.min(toCount(racer?.[level]) / total, 1);
  });
  const traveled = fractions.reduce((sum, f) => sum + f, 0);
  const certified = Boolean(racer?.certified);

  if (certified) {
    return { fractions, traveled, certified, u: APEX_U, galaxyIndex: GALAXIES.length, pct: 100 };
  }

  // Sem a certificação a nave para na borda da última galáxia.
  const u = ROUTE_START + traveled * GALAXY_SPAN;
  const galaxyIndex = Math.min(Math.floor(traveled), GALAXIES.length - 1);
  // 99% no máximo: os 100% ficam reservados para quem chegou ao ápice.
  const pct = Math.min(Math.round((traveled / GALAXIES.length) * 100), 99);
  return { fractions, traveled, certified, u, galaxyIndex, pct };
}

export function positionLabel(position) {
  if (position.certified) return `Chegou à ${APEX_NAME}`;
  const galaxy = GALAXIES[position.galaxyIndex];
  const within = Math.round(position.fractions[position.galaxyIndex] * 100);
  if (position.traveled === 0) return `Na largada, rumo à ${galaxy.name}`;
  if (position.traveled >= GALAXIES.length) return `Atravessou as três galáxias — falta o Projeto de Certificação`;
  return `Na ${galaxy.name} — ${within}% percorrida`;
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
  return (rows ?? []).map((row, index) => ({
    id: index,
    name: shortName(row.user_name),
    isCurrentUser: Boolean(row.is_current_user),
    points: toCount(row.points),
    position: racePosition(row, totals),
  }));
}
