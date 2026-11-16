import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RankingPage from '../pages/RankingPage';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('../../lib/supabase', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('../components/Layout', () => ({ default: ({ children }) => <div>{children}</div> }));

const ME = { rank_pos: 2, participants: 14, points: 130, lessons: 10, access_days: 6, posts: 1, questions: 0, answers: 2 };
const WEEK = [
  { user_name: 'Bia Souza', rank_pos: 1, points: 80, lessons: 7, is_current_user: false },
  { user_name: 'Aluno Teste', rank_pos: 2, points: 50, lessons: 4, is_current_user: true },
];

/** @param {{ me?: any[], ranking?: any[], rankingError?: any }} [options] */
function setup({ me = [ME], ranking = WEEK, rankingError = null } = {}) {
  mocks.rpc.mockImplementation((name) => Promise.resolve(
    name === 'get_my_gamification'
      ? { data: me, error: null }
      : { data: rankingError ? null : ranking, error: rankingError }
  ));
  return render(<RankingPage />);
}

describe('RankingPage', () => {
  beforeEach(() => mocks.rpc.mockReset());

  it('mostra pontuação, posição e medalhas do aluno', async () => {
    setup();
    expect(await screen.findByText('130 pts')).toBeInTheDocument();
    expect(screen.getByText(/2º lugar no ranking geral, entre 14 participantes/)).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Ritmo de estudo: conquistada' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Presença: 6 de 7' })).toBeInTheDocument();
    expect(screen.getByText(/Próxima medalha:/)).toHaveTextContent('Presença');
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
