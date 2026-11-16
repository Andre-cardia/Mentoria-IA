import { describe, expect, it } from 'vitest';
import { groupModulesByTrack } from '../lib/tracks';

const tracks = [
  { id: 't-avancado', title: 'Trilha Avançada', order: 2 },
  { id: 't-basico', title: 'Trilha Básica', order: 0 },
];

describe('groupModulesByTrack', () => {
  it('ordena trilhas e cursos pela ordem configurada', () => {
    const modules = [
      { id: 'm3', order: 5, track_id: 't-basico' },
      { id: 'm1', order: 1, track_id: 't-basico' },
      { id: 'm2', order: 3, track_id: 't-avancado' },
    ];

    const { groups, ungrouped } = groupModulesByTrack(tracks, modules);

    expect(groups.map((g) => g.track.id)).toEqual(['t-basico', 't-avancado']);
    expect(groups[0].modules.map((m) => m.id)).toEqual(['m1', 'm3']);
    expect(groups[1].modules.map((m) => m.id)).toEqual(['m2']);
    expect(ungrouped).toEqual([]);
  });

  it('mantém visíveis os cursos sem trilha ou com trilha inexistente', () => {
    const modules = [
      { id: 'solto', order: 0, track_id: null },
      { id: 'orfao', order: 1, track_id: 't-removida' },
      { id: 'legado', order: 2 },
    ];

    const { groups, ungrouped } = groupModulesByTrack(tracks, modules);

    expect(groups.every((g) => g.modules.length === 0)).toBe(true);
    expect(ungrouped.map((m) => m.id)).toEqual(['solto', 'orfao', 'legado']);
  });

  it('sem trilhas, devolve todos os cursos como não agrupados', () => {
    const { groups, ungrouped } = groupModulesByTrack([], [{ id: 'm1', order: 0, track_id: 't-basico' }]);
    expect(groups).toEqual([]);
    expect(ungrouped.map((m) => m.id)).toEqual(['m1']);
  });
});
