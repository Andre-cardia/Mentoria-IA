export const TRACK_LEVEL_LABEL = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

function byOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0);
}

/**
 * Agrupa cursos (modules) nas suas trilhas, preservando a ordem de ambos.
 * Cursos sem trilha — ou apontando para uma trilha inexistente — vão para
 * `ungrouped`, para nunca sumirem da listagem do aluno.
 *
 * @template {{id: string, order?: number}} T
 * @template {{id: string, order?: number, track_id?: string | null}} M
 * @param {T[]} tracks
 * @param {M[]} modules
 * @returns {{ groups: Array<{ track: T, modules: M[] }>, ungrouped: M[] }}
 */
export function groupModulesByTrack(tracks = [], modules = []) {
  const sortedModules = modules.slice().sort(byOrder);
  const groups = tracks
    .slice()
    .sort(byOrder)
    .map((track) => ({
      track,
      modules: sortedModules.filter((mod) => mod.track_id === track.id),
    }));

  const knownTrackIds = new Set(tracks.map((track) => track.id));
  const ungrouped = sortedModules.filter((mod) => !mod.track_id || !knownTrackIds.has(mod.track_id));

  return { groups, ungrouped };
}
