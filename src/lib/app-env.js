// A plataforma tem dois ambientes no mesmo domínio:
//   /plataforma → ensino (alunos)
//   /gestao     → administrativo e comercial (equipe)
// Cada um tem seu próprio login e sua própria sessão.

export const GESTAO_BASE = '/gestao';
export const ENSINO_BASE = '/plataforma';
export const STAFF_ROLES = ['admin', 'comercial'];

export function isGestaoPath(pathname) {
  if (typeof pathname !== 'string') return false;
  return pathname === GESTAO_BASE || pathname.startsWith(`${GESTAO_BASE}/`);
}

export function isGestaoApp() {
  return typeof window !== 'undefined' && isGestaoPath(window.location.pathname);
}

export function appBasePath() {
  return isGestaoApp() ? GESTAO_BASE : ENSINO_BASE;
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}
