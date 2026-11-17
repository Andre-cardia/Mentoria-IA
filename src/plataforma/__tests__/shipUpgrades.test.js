import { describe, expect, it } from 'vitest';
import { SHIP_UPGRADES, nextUpgrade, unlockedUpgradeIds, upgradeStatus } from '../lib/shipUpgrades';
import { GRANTABLE_RANKS, RANKS, buildRacers, rankFor } from '../lib/starRace';

describe('acessórios da nave', () => {
  it('não instala nada sem módulos concluídos', () => {
    expect(unlockedUpgradeIds(0)).toEqual([]);
    expect(unlockedUpgradeIds(undefined)).toEqual([]);
    expect(nextUpgrade(0).id).toBe('antenna');
  });

  it('instala conforme os módulos concluídos', () => {
    expect(unlockedUpgradeIds(1)).toEqual(['antenna']);
    expect(unlockedUpgradeIds(3)).toEqual(['antenna', 'gridfins', 'legs']);
    expect(nextUpgrade(4)).toMatchObject({ id: 'shield', remaining: 2 });
  });

  it('nave completa não tem próximo acessório', () => {
    const last = SHIP_UPGRADES[SHIP_UPGRADES.length - 1].modules;
    expect(nextUpgrade(last)).toBeNull();
    expect(upgradeStatus(last).every((upgrade) => upgrade.unlocked)).toBe(true);
  });

  it('exige mais módulos a cada acessório', () => {
    const counts = SHIP_UPGRADES.map((upgrade) => upgrade.modules);
    expect([...counts].sort((a, b) => a - b)).toEqual(counts);
    expect(new Set(counts).size).toBe(counts.length);
  });
});

describe('patentes', () => {
  it('uma estrela a mais por patente', () => {
    expect(RANKS.map((rank) => rank.stars)).toEqual([1, 2, 3, 4]);
    expect(RANKS.map((rank) => rank.name)).toEqual(['Aspirante', 'Primeiro Oficial', 'Comandante', 'Master']);
  });

  it('Aspirante e Primeiro Oficial vêm dos pontos', () => {
    expect(rankFor({ traveled: 0 }).id).toBe('aspirante');
    expect(rankFor({ traveled: 0.99 }).id).toBe('aspirante');
    expect(rankFor({ traveled: 1 }).id).toBe('primeiro_oficial');
  });

  it('Comandante e Master só com o aval de um admin', () => {
    expect(rankFor({ traveled: 2 }).id).toBe('primeiro_oficial');
    expect(rankFor({ traveled: 3 }).id).toBe('primeiro_oficial');
    expect(rankFor({ traveled: 2.4 }, 'comandante')).toMatchObject({ id: 'comandante', promoted: false });
    expect(rankFor({ traveled: 3 }, 'master')).toMatchObject({ id: 'master', promoted: false });
    expect(GRANTABLE_RANKS.map((rank) => rank.id)).toEqual(['primeiro_oficial', 'comandante', 'master']);
  });

  it('promoção por mérito eleva a patente, nunca rebaixa', () => {
    expect(rankFor({ traveled: 0.2 }, 'primeiro_oficial')).toMatchObject({ id: 'primeiro_oficial', promoted: true });
    expect(rankFor({ traveled: 0.2 }, 'comandante')).toMatchObject({ id: 'comandante', promoted: true });
    expect(rankFor({ traveled: 1.5 }, 'primeiro_oficial')).toMatchObject({ id: 'primeiro_oficial', promoted: false });
    expect(rankFor({ traveled: 0.2 }, 'qualquer')).toMatchObject({ id: 'aspirante', promoted: false });
  });

  it('buildRacers traz patente e módulos concluídos', () => {
    const totals = { basico: 10, intermediario: 10, avancado: 10 };
    const [racer] = buildRacers([{ user_name: 'Ana Aluna', points: 70, modules_completed: '2', granted_rank: null }], totals);
    expect(racer.rank.id).toBe('primeiro_oficial');
    expect(racer.modulesCompleted).toBe(2);
  });
});
