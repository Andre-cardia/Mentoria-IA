import { describe, expect, it } from 'vitest';
import { APEX_U, buildRacers, galaxyCenterU, levelTotals, positionLabel, racePosition, shortName } from '../lib/starRace';

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

  it('coloca quem não começou na largada da primeira galáxia', () => {
    const position = racePosition({}, TOTALS);
    expect(position).toMatchObject({ traveled: 0, galaxyIndex: 0, pct: 0, certified: false, u: 0.125 });
    expect(positionLabel(position)).toBe('Na largada, rumo à Galáxia Básica');
  });

  it('avança pela rota conforme as aulas de cada galáxia', () => {
    const meio = racePosition({ basico: 5 }, TOTALS);
    expect(meio.u).toBeCloseTo(galaxyCenterU(0));
    expect(positionLabel(meio)).toBe('Na Galáxia Básica — 50% percorrida');

    const segunda = racePosition({ basico: '10', intermediario: '5' }, TOTALS);
    expect(segunda).toMatchObject({ galaxyIndex: 1, pct: 42 });
    expect(positionLabel(segunda)).toBe('Na Galáxia Intermediária — 25% percorrida');
  });

  it('não passa de 100% em uma galáxia nem divide por zero', () => {
    expect(racePosition({ basico: 50 }, TOTALS).fractions[0]).toBe(1);
    expect(racePosition({ basico: 3 }, { basico: 0 }).traveled).toBe(0);
  });

  it('só chega ao ápice com a certificação', () => {
    const tudo = { basico: 10, intermediario: 20, avancado: 10 };
    const semCert = racePosition(tudo, TOTALS);
    expect(semCert).toMatchObject({ certified: false, pct: 99, galaxyIndex: 2 });
    expect(semCert.u).toBeLessThan(APEX_U);
    expect(positionLabel(semCert)).toContain('falta o Projeto de Certificação');

    const comCert = racePosition({ ...tudo, certified: true }, TOTALS);
    expect(comCert).toMatchObject({ certified: true, pct: 100, galaxyIndex: 3, u: APEX_U });
    expect(positionLabel(comCert)).toBe('Chegou à Estrela da Certificação');
  });

  it('abrevia nomes para a etiqueta da nave', () => {
    expect(shortName('Maria Clara Souza')).toBe('Maria S.');
    expect(shortName('  ana ')).toBe('ana');
    expect(shortName('')).toBe('Aluno');
  });

  it('monta as naves a partir das linhas do banco', () => {
    const racers = buildRacers([{ user_name: 'Ana Aluna', is_current_user: true, points: '64', basico: '5' }], TOTALS);
    expect(racers).toHaveLength(1);
    expect(racers[0]).toMatchObject({ name: 'Ana A.', isCurrentUser: true, points: 64 });
    expect(racers[0].position.fractions[0]).toBe(0.5);
  });
});
