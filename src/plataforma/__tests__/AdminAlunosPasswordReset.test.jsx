import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'fake-token' } },
      }),
    },
  },
}));

global.fetch = vi.fn();

import AdminAlunosPage from '../pages/admin/AdminAlunosPage';

const fakeAuthValue = {
  user: { id: 'admin-id', email: 'admin@test.com' },
  loading: false,
  role: 'admin',
  isAdmin: true,
  isCommercial: false,
  hasCrmAccess: false,
  profile: { full_name: 'Admin' },
  profileError: null,
  refreshProfile: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
};

const mockStudents = [
  {
    user_id: 'uuid-1',
    full_name: 'João Silva',
    email: 'joao@example.com',
    phone: '48999990000',
    status: 'active',
    created_at: '2026-04-01T00:00:00Z',
  },
  {
    user_id: 'uuid-2',
    full_name: 'Maria Souza',
    email: 'maria@example.com',
    phone: null,
    status: 'active',
    created_at: '2026-04-02T00:00:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={fakeAuthValue}>
        <AdminAlunosPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('AdminAlunosPage — redefinição de senha', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ students: mockStudents, pendingRegistration: [] }),
    });
  });

  it('exibe botão 🔑 para cada aluno matriculado', async () => {
    renderPage();
    const buttons = await screen.findAllByTitle('Redefinir senha');
    expect(buttons).toHaveLength(mockStudents.length);
  });

  it('abre modal com nome do aluno ao clicar em 🔑', async () => {
    renderPage();
    const [firstBtn] = await screen.findAllByTitle('Redefinir senha');
    await userEvent.click(firstBtn);
    expect(screen.getByText(/Redefinir senha — João Silva/i)).toBeTruthy();
  });

  it('exibe erro inline quando senhas não coincidem (sem chamar API)', async () => {
    renderPage();
    const [firstBtn] = await screen.findAllByTitle('Redefinir senha');
    await userEvent.click(firstBtn);

    await userEvent.type(screen.getByPlaceholderText('mínimo 8 caracteres'), 'Senha123');
    await userEvent.type(screen.getByPlaceholderText('repita a senha'), 'Senha456');
    await userEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    expect(screen.getByText('As senhas não coincidem')).toBeTruthy();
    // fetch foi chamado apenas para carregar alunos, não para POST da senha
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('exibe erro inline quando senha tem menos de 8 caracteres (sem chamar API)', async () => {
    renderPage();
    const [firstBtn] = await screen.findAllByTitle('Redefinir senha');
    await userEvent.click(firstBtn);

    await userEvent.type(screen.getByPlaceholderText('mínimo 8 caracteres'), 'abc');
    await userEvent.type(screen.getByPlaceholderText('repita a senha'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    expect(screen.getByText('Senha deve ter pelo menos 8 caracteres')).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('chama POST /api/admin/students/:id/password ao submeter senha válida', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ students: mockStudents, pendingRegistration: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ students: mockStudents, pendingRegistration: [] }),
      });

    renderPage();
    const [firstBtn] = await screen.findAllByTitle('Redefinir senha');
    await userEvent.click(firstBtn);

    await userEvent.type(screen.getByPlaceholderText('mínimo 8 caracteres'), 'NovaSenha123');
    await userEvent.type(screen.getByPlaceholderText('repita a senha'), 'NovaSenha123');
    await userEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    await waitFor(() => {
      const postCall = global.fetch.mock.calls.find(
        ([url, opts]) => url.includes('/password') && opts?.method === 'POST'
      );
      expect(postCall).toBeTruthy();
      expect(JSON.parse(postCall[1].body)).toEqual({ password: 'NovaSenha123' });
    });
  });

  it('fecha modal após sucesso', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ students: mockStudents, pendingRegistration: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ students: mockStudents, pendingRegistration: [] }),
      });

    renderPage();
    const [firstBtn] = await screen.findAllByTitle('Redefinir senha');
    await userEvent.click(firstBtn);

    await userEvent.type(screen.getByPlaceholderText('mínimo 8 caracteres'), 'NovaSenha123');
    await userEvent.type(screen.getByPlaceholderText('repita a senha'), 'NovaSenha123');
    await userEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Redefinir senha — João Silva/i)).toBeNull();
    });
  });

  it('exibe erro da API no modal sem fechá-lo', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ students: mockStudents, pendingRegistration: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Erro ao redefinir senha' }),
      });

    renderPage();
    const [firstBtn] = await screen.findAllByTitle('Redefinir senha');
    await userEvent.click(firstBtn);

    await userEvent.type(screen.getByPlaceholderText('mínimo 8 caracteres'), 'NovaSenha123');
    await userEvent.type(screen.getByPlaceholderText('repita a senha'), 'NovaSenha123');
    await userEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    await waitFor(() => {
      expect(screen.getByText('Erro ao redefinir senha')).toBeTruthy();
      expect(screen.getByText(/Redefinir senha — João Silva/i)).toBeTruthy();
    });
  });
});
