import { describe, expect, it } from 'vitest';
import { filterByJoinDate, inactivityStatus, sortStudents, studentsEmailCsv, upcomingAnniversaries, withOverview } from '../lib/students';

const STUDENTS = [
  { user_id: '1', full_name: 'Érica Lima', email: 'erica@x.com', created_at: '2026-03-10T12:00:00', status: 'active' },
  { user_id: '2', full_name: 'bruno Alves', email: 'bruno@x.com', created_at: '2025-12-01T12:00:00', status: 'active' },
  { user_id: '3', full_name: 'Zélia Souza', email: 'zelia@x.com', created_at: '2026-01-20T12:00:00', status: 'suspended' },
];
const names = (list) => list.map((s) => s.full_name);

describe('ordenação de alunos', () => {
  it('ordem alfabética ignora acentos e maiúsculas', () => {
    expect(names(sortStudents(STUDENTS, 'name', 'asc'))).toEqual(['bruno Alves', 'Érica Lima', 'Zélia Souza']);
    expect(names(sortStudents(STUDENTS, 'name', 'desc'))).toEqual(['Zélia Souza', 'Érica Lima', 'bruno Alves']);
  });

  it('ordena por data de ingresso sem alterar a lista original', () => {
    expect(names(sortStudents(STUDENTS, 'created_at', 'asc'))).toEqual(['bruno Alves', 'Zélia Souza', 'Érica Lima']);
    expect(names(sortStudents(STUDENTS, 'created_at', 'desc'))).toEqual(['Érica Lima', 'Zélia Souza', 'bruno Alves']);
    expect(names(STUDENTS)[0]).toBe('Érica Lima');
  });
});

describe('filtro por data de ingresso', () => {
  it('sem datas não filtra', () => {
    expect(filterByJoinDate(STUDENTS)).toHaveLength(3);
  });

  it('as duas datas são inclusivas', () => {
    expect(names(filterByJoinDate(STUDENTS, '2026-01-20', '2026-03-10'))).toEqual(['Érica Lima', 'Zélia Souza']);
    expect(names(filterByJoinDate(STUDENTS, '2026-01-21', ''))).toEqual(['Érica Lima']);
    expect(names(filterByJoinDate(STUDENTS, '', '2025-12-31'))).toEqual(['bruno Alves']);
  });
});

describe('aviso de 1 ano de plataforma', () => {
  it('avisa com até 30 dias de antecedência, do mais próximo ao mais distante', () => {
    const now = new Date('2026-12-25T09:00:00');
    const soon = upcomingAnniversaries(STUDENTS, now);
    expect(soon.map((s) => [s.full_name, s.daysLeft])).toEqual([['Zélia Souza', 26]]);
  });

  it('inclui o próprio dia e exclui quem já passou ou está longe', () => {
    expect(upcomingAnniversaries(STUDENTS, new Date('2026-12-01T23:00:00')).map((s) => s.daysLeft)).toEqual([0]);
    expect(upcomingAnniversaries(STUDENTS, new Date('2026-12-02T08:00:00'))).toEqual([]);
    expect(upcomingAnniversaries(STUDENTS, new Date('2026-10-31T08:00:00'))).toEqual([]);
    expect(upcomingAnniversaries(STUDENTS, new Date('2026-11-01T08:00:00')).map((s) => s.daysLeft)).toEqual([30]);
  });

  it('ignora matrículas canceladas', () => {
    const cancelled = [{ ...STUDENTS[1], status: 'cancelled' }];
    expect(upcomingAnniversaries(cancelled, new Date('2026-11-20T08:00:00'))).toEqual([]);
  });
});

describe('exportação de e-mails', () => {
  it('gera CSV separado por ponto e vírgula, só de quem tem e-mail', () => {
    const csv = studentsEmailCsv([...STUDENTS, { full_name: 'Sem Email' }, { full_name: 'Silva; Ana "Nina"', email: 'ana@x.com' }]);
    expect(csv.split('\r\n')).toEqual([
      'nome;email',
      'Érica Lima;erica@x.com',
      'bruno Alves;bruno@x.com',
      'Zélia Souza;zelia@x.com',
      '"Silva; Ana ""Nina""";ana@x.com',
    ]);
  });
});

describe('pontos e inatividade', () => {
  const now = new Date('2027-01-20T12:00:00');

  it('junta pontos e último acesso e ordena por pontos', () => {
    const merged = withOverview(STUDENTS, [{ user_id: '2', points: '40' }, { user_id: '3', points: 120 }]);
    expect(merged.map((s) => s.points)).toEqual([0, 40, 120]);
    expect(names(sortStudents(merged, 'points', 'desc'))).toEqual(['Zélia Souza', 'bruno Alves', 'Érica Lima']);
  });

  it('alerta só depois de 30 dias sem acesso', () => {
    expect(inactivityStatus({ inactive_since: '2026-12-21T12:00:00' }, now)).toMatchObject({ alert: false, days: 30 });
    expect(inactivityStatus({ inactive_since: '2026-12-20T12:00:00' }, now)).toMatchObject({ alert: true, dismissed: false, days: 31 });
  });

  it('a observação do admin desativa o alerta', () => {
    const status = inactivityStatus({ inactive_since: '2026-12-01T12:00:00', alert_note: 'Em viagem' }, now);
    expect(status).toMatchObject({ alert: false, dismissed: true, note: 'Em viagem' });
  });

  it('quem voltou a acessar não tem alerta, mesmo com observação antiga', () => {
    // O servidor só devolve a observação se ela for posterior ao último acesso.
    expect(inactivityStatus({ inactive_since: '2027-01-19T12:00:00', alert_note: null }, now)).toMatchObject({ alert: false, dismissed: false });
  });

  it('sem dados ou com matrícula cancelada não há alerta', () => {
    expect(inactivityStatus({}, now).alert).toBe(false);
    expect(inactivityStatus({ inactive_since: '2026-01-01T12:00:00', status: 'cancelled' }, now).alert).toBe(false);
  });
});
