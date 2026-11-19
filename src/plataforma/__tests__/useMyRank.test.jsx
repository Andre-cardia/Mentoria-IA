import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));

vi.mock('../../lib/supabase', () => ({ supabase: { rpc: mocks.rpc, from: mocks.from } }));
vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'aluno-1', email: 'aluno@example.com' },
    isAdmin: false,
    profile: { full_name: 'Aluno Teste', avatar_url: null },
    signOut: vi.fn(),
  }),
}));
vi.mock('../hooks/useLessonProgress', () => ({
  useLessonProgress: () => ({ getTotalProgress: () => ({ completed: 0, total: 0 }) }),
}));

import Layout from '../components/Layout';
import { loadMyRank, resetMyRankCache } from '../hooks/useMyRank';

// 4 aulas no básico → a Galáxia Básica pede 24 pontos.
const TRACKS = [
  { level: 'basico', modules: [{ lessons: [{}, {}, {}, {}] }] },
  { level: 'intermediario', modules: [{ lessons: [{}, {}] }] },
  { level: 'avancado', modules: [{ lessons: [{}, {}] }] },
];

function setup(race, { raceError = null } = {}) {
  mocks.from.mockImplementation((table) => ({
    select: () => Promise.resolve({ data: table === 'tracks' ? TRACKS : [], error: null }),
  }));
  mocks.rpc.mockResolvedValue({ data: raceError ? null : race, error: raceError });
}

describe('patente do aluno logado', () => {
  beforeEach(() => {
    resetMyRankCache();
    mocks.rpc.mockReset();
    mocks.from.mockReset();
  });

  it('calcula a patente pela posição na corrida e pelo aval', async () => {
    setup([{ user_name: 'Outro', is_current_user: false, points: 999 }, { user_name: 'Aluno', is_current_user: true, points: 30 }]);
    expect((await loadMyRank('aluno-1')).name).toBe('Primeiro Oficial');

    resetMyRankCache();
    setup([{ user_name: 'Aluno', is_current_user: true, points: 0, granted_rank: 'master' }]);
    expect((await loadMyRank('aluno-1')).ship.name).toBe('Starship');
  });

  it('consulta o banco uma vez só para o mesmo aluno', async () => {
    setup([{ user_name: 'Aluno', is_current_user: true, points: 5 }]);
    await loadMyRank('aluno-1');
    await loadMyRank('aluno-1');
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('get_star_race', { p_limit: 1 });
  });

  it('devolve null quando a corrida não carrega', async () => {
    setup(null, { raceError: { message: 'falhou' } });
    expect(await loadMyRank('aluno-1')).toBeNull();
  });

  it('mostra nome e badges do aluno no menu lateral', async () => {
    setup([{ user_name: 'Aluno', is_current_user: true, points: 5 }]);
    render(<MemoryRouter><Layout><div>Conteúdo</div></Layout></MemoryRouter>);
    expect(screen.getByText('Aluno Teste')).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Patente Cadete, nave Falcon 9' })).toBeInTheDocument();
  });
});
