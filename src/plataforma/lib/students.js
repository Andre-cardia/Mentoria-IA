// Regras da tela de alunos do admin: ordenação, filtro por data de ingresso,
// aviso de 1 ano de plataforma e exportação de e-mails.

const DAY_MS = 24 * 60 * 60 * 1000;

export const ANNIVERSARY_NOTICE_DAYS = 30;

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Converte "2026-11-16" (campo de data) para o início desse dia, no fuso local. */
function parseDateInput(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/**
 * Ordena por nome (ordem alfabética, ignorando acentos e maiúsculas) ou por
 * data de ingresso. `direction`: 'asc' | 'desc'. Não altera a lista original.
 */
export function sortStudents(students = [], key = 'created_at', direction = 'desc') {
  const factor = direction === 'asc' ? 1 : -1;
  return [...students].sort((a, b) => {
    if (key === 'points') {
      return factor * ((Number(a.points) || 0) - (Number(b.points) || 0));
    }
    if (key === 'name') {
      return factor * String(a.full_name ?? '').localeCompare(String(b.full_name ?? ''), 'pt-BR', { sensitivity: 'base' });
    }
    return factor * (new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime());
  });
}

/** Mantém quem ingressou entre `from` e `to` (datas "AAAA-MM-DD", inclusivas; vazias não limitam). */
export function filterByJoinDate(students = [], from = '', to = '') {
  const start = parseDateInput(from);
  const end = parseDateInput(to);
  if (!start && !end) return students;
  const endExclusive = end ? new Date(end.getTime() + DAY_MS) : null;
  return students.filter((student) => {
    if (!student.created_at) return false;
    const joined = new Date(student.created_at);
    if (start && joined < start) return false;
    if (endExclusive && joined >= endExclusive) return false;
    return true;
  });
}

/**
 * Alunos que completam 1 ano de plataforma nos próximos `days` dias (hoje
 * incluído), do mais próximo ao mais distante. Matrículas canceladas ficam de fora.
 */
export function upcomingAnniversaries(students = [], now = new Date(), days = ANNIVERSARY_NOTICE_DAYS) {
  const today = startOfDay(now);
  return students
    .filter((student) => student.created_at && student.status !== 'cancelled')
    .map((student) => {
      const anniversary = startOfDay(student.created_at);
      anniversary.setFullYear(anniversary.getFullYear() + 1);
      const daysLeft = Math.round((anniversary.getTime() - today.getTime()) / DAY_MS);
      return { ...student, anniversary, daysLeft };
    })
    .filter((student) => student.daysLeft >= 0 && student.daysLeft <= days)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export const INACTIVITY_ALERT_DAYS = 30;

/**
 * Situação de inatividade de um aluno, a partir da visão do admin
 * (`inactive_since`, `alert_note`). `alert` = está há mais de 30 dias sem
 * acessar; `dismissed` = um admin desativou o alerta com uma observação.
 * Matrículas canceladas não geram alerta.
 */
export function inactivityStatus(student, now = new Date()) {
  if (!student?.inactive_since || student.status === 'cancelled') {
    return { alert: false, dismissed: false, days: 0, note: '' };
  }
  const days = Math.floor((now.getTime() - new Date(student.inactive_since).getTime()) / DAY_MS);
  const inactive = days > INACTIVITY_ALERT_DAYS;
  const note = student.alert_note ?? '';
  return { alert: inactive && !note, dismissed: inactive && Boolean(note), days: Math.max(days, 0), note };
}

/** Junta a lista de alunos com pontos e último acesso (por user_id). */
export function withOverview(students = [], overview = []) {
  const byId = new Map((overview ?? []).map((row) => [row.user_id, row]));
  return students.map((student) => {
    const row = byId.get(student.user_id);
    return {
      ...student,
      points: Number(row?.points) || 0,
      last_access_at: row?.last_access_at ?? null,
      inactive_since: row?.inactive_since ?? null,
      alert_note: row?.alert_note ?? null,
    };
  });
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV separado por ponto e vírgula (abre direto no Excel em português): nome;email. */
export function studentsEmailCsv(students = []) {
  const rows = students
    .filter((student) => student.email)
    .map((student) => [student.full_name, student.email].map(csvCell).join(';'));
  return ['nome;email', ...rows].join('\r\n');
}
