import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RankingPage from '../pages/RankingPage';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));

vi.mock('../../lib/supabase', () => ({ supabase: { rpc: mocks.rpc, from: mocks.from } }));
// O cenário 3D precisa de WebGL, que não existe no ambiente de teste.
vi.mock('../components/StarRace', () => ({
  default: ({ racers }) => <div data-testid="star-race">{racers.length} naves</div>,
}));
vi.mock('../components/Layout', () => ({ default: ({ children }) => <div>{children}</div> }));

const ME = { rank_pos: 2, participants: 14, points: 130, lessons: 10, access_days: 6, posts: 1, questions: 0, answers: 2 };
const RACE = [
  { user_name: 'Bia Souza', is_current_user: false, points: 80, basico: 4, intermediario: 0, avancado: 0, certified: false },
  { user_name: 'Aluno Teste', is_current_user: true, points: 50, basico: 2, intermediario: 0, avancado: 0, certified: false },
];
const TRACKS = [
  { level: 'basico', modules: [{ lessons: [{}, {}, {}, {}] }] },
  { level: 'intermediario', modules: [{ lessons: [{}, {}] }] },
  { level: 'avancado', modules: [{ lessons: [{}, {}] }] },
];
const WEEK = [
  { user_name: 'Bia Souza', rank_pos: 1, points: 80, lessons: 7, is_current_user: false },
  { user_name: 'Aluno Teste', rank_pos: 2, points: 50, lessons: 4, is_current_user: true },
];

/** @param {{ me?: any[], ranking?: any[], rankingError?: any, race?: any[] }} [options] */
function setup({ me = [ME], ranking = WEEK, rankingError = null, race = RACE } = {}) {
  mocks.from.mockReturnValue({ select: () => Promise.resolve({ data: TRACKS, error: null }) });
  mocks.rpc.mockImplementation((name) => {
    if (name === 'get_my_gamification') return Promise.resolve({ data: me, error: null });
    if (name === 'get_star_race') return Promise.resolve({ data: race, error: null });
    return Promise.resolve({ data: rankingError ? null : ranking, error: rankingError });
  });
  return render(<RankingPage />);
}

describe('RankingPage', () => {
  beforeEach(() => { mocks.rpc.mockReset(); mocks.from.mockReset(); });

  it('mostra pontuação, posição e medalhas do aluno', async () => {
    setup();
    expect(await screen.findByText('130 pts')).toBeInTheDocument();
    expect(screen.getByText(/2º lugar no ranking geral, entre 14 participantes/)).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Ritmo de estudo: conquistada' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Presença: 6 de 7' })).toBeInTheDocument();
    expect(screen.getByText(/Próxima medalha:/)).toHaveTextContent('Presença');
  });

  it('mostra a corrida com a posição do aluno em cada galáxia', async () => {
    setup();
    expect(await screen.findByTestId('star-race')).toHaveTextContent('2 naves');
    expect(screen.getByText(/Na Galáxia Básica — 50% percorrida/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Galáxia Básica' })).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText(/conclua o Projeto de Certificação/)).toBeInTheDocument();
  });

  it('comemora quando o aluno chega ao ápice', async () => {
    setup({ race: [{ ...RACE[1], basico: 4, intermediario: 2, avancado: 2, certified: true }] });
    expect(await screen.findByText(/Chegou à Estrela da Certificação/)).toBeInTheDocument();
    expect(screen.getByText('Você chegou ao ápice da jornada!')).toBeInTheDocument();
  });

  it('lista o ranking da semana e destaca o próprio aluno', async () => {
    setup();
    expect(await screen.findByText('Bia Souza')).toBeInTheDocument();
    expect(screen.getByText('(você)')).toBeInTheDocument();
    expect(mocks.rpc).toHaveBeenCalledWith('get_gamification_ranking', { p_period: 'week', p_limit: 20 });
  });

  it('troca o período ao clicar em Geral', async () => {
    setup();
    await screen.findByText('Bia Souza');
    fireEvent.click(screen.getByRole('button', { name: 'Geral' }));
    await waitFor(() =>
      expect(mocks.rpc).toHaveBeenCalledWith('get_gamification_ranking', { p_period: 'all', p_limit: 20 })
    );
    expect(screen.getByRole('button', { name: 'Geral' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('convida a participar quando o aluno ainda não pontuou', async () => {
    setup({ me: [{ rank_pos: null, participants: 0, points: 0 }], ranking: [] });
    expect(await screen.findByText(/para entrar no ranking/)).toBeInTheDocument();
    expect(await screen.findByText(/Ninguém pontuou neste período/)).toBeInTheDocument();
  });

  it('avisa quando o ranking não carrega', async () => {
    setup({ rankingError: { message: 'falhou' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o ranking.');
  });
});
