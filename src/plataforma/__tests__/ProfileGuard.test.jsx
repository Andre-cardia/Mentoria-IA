import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const authState = {
  user: null,
  isAdmin: false,
};

const queryBuilder = {
  select: vi.fn(() => queryBuilder),
  eq: vi.fn(() => queryBuilder),
  maybeSingle: vi.fn(),
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => queryBuilder),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

import { supabase } from '../../lib/supabase';
import ProfileGuard from '../components/ProfileGuard';

function renderGuard(authOverrides = {}, initialPath = '/') {
  Object.assign(authState, {
    user: null,
    isAdmin: false,
    ...authOverrides,
  });

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/"
          element={<ProfileGuard><div>Conteúdo Liberado</div></ProfileGuard>}
        />
        <Route path="/completar-perfil" element={<div>Completar Perfil</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProfileGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('libera acesso direto para admin sem consultar profiles', async () => {
    renderGuard({ user: { id: 'admin-user' }, isAdmin: true });

    expect(screen.getByText('Conteúdo Liberado')).toBeInTheDocument();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('redireciona para completar perfil quando não encontra profile', async () => {
    queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    renderGuard({ user: { id: 'student-user' }, isAdmin: false });

    await waitFor(() => {
      expect(screen.getByText('Completar Perfil')).toBeInTheDocument();
    });
  });

  it('bloqueia acesso quando o perfil está suspenso', async () => {
    queryBuilder.maybeSingle.mockResolvedValue({
      data: { user_id: 'student-user', status: 'suspended' },
      error: null,
    });

    renderGuard({ user: { id: 'student-user' }, isAdmin: false });

    await waitFor(() => {
      expect(screen.getByText('Conta suspensa')).toBeInTheDocument();
    });
    expect(screen.queryByText('Conteúdo Liberado')).not.toBeInTheDocument();
  });

  it('mostra erro temporário quando a leitura do perfil falha', async () => {
    queryBuilder.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'timeout' },
    });

    renderGuard({ user: { id: 'student-user' }, isAdmin: false });

    await waitFor(() => {
      expect(screen.getByText('Erro ao validar seu acesso')).toBeInTheDocument();
    });
    expect(screen.queryByText('Completar Perfil')).not.toBeInTheDocument();
  });

  it('libera acesso quando o perfil está ativo', async () => {
    queryBuilder.maybeSingle.mockResolvedValue({
      data: { user_id: 'student-user', status: 'active' },
      error: null,
    });

    renderGuard({ user: { id: 'student-user' }, isAdmin: false });

    await waitFor(() => {
      expect(screen.getByText('Conteúdo Liberado')).toBeInTheDocument();
    });
  });
});
