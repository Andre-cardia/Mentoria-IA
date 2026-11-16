import { describe, expect, it } from 'vitest';
import { APEX_U, buildRacers, galaxyCenterU, galaxyGoals, levelTotals, positionLabel, racePosition, shortName } from '../lib/starRace';

// 10, 20 e 10 aulas → cada galáxia pede 60% dos pontos das aulas: 60, 120 e 60.
const TOTALS = { basico: 10, intermediario: 20, avancado: 10 };

describe('starRace', () => {
  it('soma as aulas de cada nível e ignora níveis desconhecidos', () => {
    const tracks = [
      { level: 'basico', modules: [{ lessons: [{}, {}] }, { lessons: [{}] }] },
      { level: 'avancado', modules: [{ lessons: [{}] }, {}] },
      { level: 'outro', modules: [{ lessons: [{}] }] },
    ];
    expect(levelTotals(tracks)).toEqual({ basico: 3, intermediario: 0, avancado: 1 });
    expect(levelTotals(null)).toEqual({ basico: 0, intermediario: 0, avancado: 0 });
  });

  it('cada galáxia pede 60% dos pontos das aulas do nível, com um mínimo', () => {
    expect(galaxyGoals(TOTALS)).toEqual([60, 120, 60]);
    expect(galaxyGoals({})).toEqual([10, 10, 10]);
  });

  it('coloca quem não pontuou na largada da primeira galáxia', () => {
    const position = racePosition({}, TOTALS);
    expect(position).toMatchObject({ traveled: 0, galaxyIndex: 0, pct: 0, certified: false, u: 0.125 });
    expect(positionLabel(position)).toBe('Na largada, rumo à Galáxia Básica');
  });

  it('os pontos preenchem as galáxias em sequência', () => {
    const meio = racePosition({ points: 30 }, TOTALS);
    expect(meio.u).toBeCloseTo(galaxyCenterU(0));
    expect(meio.earned).toEqual([30, 0, 0]);
    expect(positionLabel(meio)).toBe('Na Galáxia Básica — 50% percorrida');

    const segunda = racePosition({ points: '90' }, TOTALS);
    expect(segunda).toMatchObject({ galaxyIndex: 1, pct: 42 });
    expect(segunda.earned).toEqual([60, 30, 0]);
    expect(positionLabel(segunda)).toBe('Na Galáxia Intermediária — 25% percorrida');
  });

  it('avança sem depender de quais aulas foram assistidas', () => {
    // Só participação (posts, respostas, acessos) também leva à segunda galáxia.
    expect(racePosition({ points: 75 }, TOTALS).galaxyIndex).toBe(1);
  });

  it('só chega ao ápice com a certificação', () => {
    const semCert = racePosition({ points: 5000 }, TOTALS);
    expect(semCert).toMatchObject({ certified: false, pct: 99, galaxyIndex: 2 });
    expect(semCert.earned).toEqual([60, 120, 60]);
    expect(semCert.u).toBeLessThan(APEX_U);
    expect(positionLabel(semCert)).toContain('falta o Projeto de Certificação');

    const comCert = racePosition({ points: 40, certified: true }, TOTALS);
    expect(comCert).toMatchObject({ certified: true, pct: 100, galaxyIndex: 3, u: APEX_U });
    expect(positionLabel(comCert)).toBe('Chegou à Estrela da Certificação');
  });

  it('abrevia nomes para a etiqueta da nave', () => {
    expect(shortName('Maria Clara Souza')).toBe('Maria S.');
    expect(shortName('  ana ')).toBe('ana');
    expect(shortName('')).toBe('Aluno');
  });

  it('monta as naves a partir das linhas do banco', () => {
    const racers = buildRacers([{ user_name: 'Ana Aluna', is_current_user: true, points: '30' }], TOTALS);
    expect(racers).toHaveLength(1);
    expect(racers[0]).toMatchObject({ name: 'Ana A.', isCurrentUser: true, points: 30 });
    expect(racers[0].position.fractions[0]).toBe(0.5);
  });
});
