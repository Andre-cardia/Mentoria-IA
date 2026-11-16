// Acessórios da nave. Cada módulo (curso) concluído por inteiro aproxima o
// aluno do próximo; são instalados automaticamente e ficam visíveis para
// todos na Corrida Estelar.
export const SHIP_UPGRADES = [
  { id: 'antenna',  modules: 1,  name: 'Antena de comunicação', description: 'Mastro e prato de transmissão' },
  { id: 'gridfins', modules: 2,  name: 'Aletas de grade',       description: 'Controle de atitude no topo do casco' },
  { id: 'legs',     modules: 3,  name: 'Pernas de pouso',       description: 'Trem de pouso retrátil' },
  { id: 'solar',    modules: 4,  name: 'Painéis solares',       description: 'Dois painéis laterais' },
  { id: 'shield',   modules: 6,  name: 'Escudo térmico',        description: 'Revestimento escuro para reentrada' },
  { id: 'engines',  modules: 8,  name: 'Conjunto de motores',   description: 'Motores extras e mais empuxo' },
  { id: 'lights',   modules: 10, name: 'Luzes de navegação',    description: 'Sinalização nas laterais e no nariz' },
  { id: 'command',  modules: 12, name: 'Acabamento de comando', description: 'Faixas douradas no casco' },
];

function toCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Ids dos acessórios já instalados para quem concluiu `modulesCompleted` módulos. */
export function unlockedUpgradeIds(modulesCompleted) {
  const done = toCount(modulesCompleted);
  return SHIP_UPGRADES.filter((upgrade) => done >= upgrade.modules).map((upgrade) => upgrade.id);
}

/** Situação de cada acessório, para a lista do painel. */
export function upgradeStatus(modulesCompleted) {
  const done = toCount(modulesCompleted);
  return SHIP_UPGRADES.map((upgrade) => ({
    ...upgrade,
    unlocked: done >= upgrade.modules,
    remaining: Math.max(upgrade.modules - done, 0),
  }));
}

/** Próximo acessório a conquistar, ou null se a nave já está completa. */
export function nextUpgrade(modulesCompleted) {
  return upgradeStatus(modulesCompleted).find((upgrade) => !upgrade.unlocked) ?? null;
}
