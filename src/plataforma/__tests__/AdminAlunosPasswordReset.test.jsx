import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/useAuth';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'fake-token' } },
      }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    // Promoções por mérito: nenhuma, nestes testes.
    from: vi.fn(() => ({ select: vi.fn().mockResolvedValue({ data: [], error: null }) })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

globalThis.fetch = vi.fn();

/** @type {import('vitest').Mock} */
const mockFetch = /** @type {typeof mockFetch} */ (/** @type {unknown} */ (globalThis.fetch));

import AdminAlunosPage from '../pages/admin/AdminAlunosPage';
import { supabase } from '../../lib/supabase';

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
    created_at: '2026-04-03T12:00:00Z',
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
    mockFetch.mockResolvedValue({
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
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('exibe erro inline quando senha tem menos de 8 caracteres (sem chamar API)', async () => {
    renderPage();
    const [firstBtn] = await screen.findAllByTitle('Redefinir senha');
    await userEvent.click(firstBtn);

    await userEvent.type(screen.getByPlaceholderText('mínimo 8 caracteres'), 'abc');
    await userEvent.type(screen.getByPlaceholderText('repita a senha'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: /redefinir/i }));

    expect(screen.getByText('Senha deve ter pelo menos 8 caracteres')).toBeTruthy();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('chama POST /api/admin/students/:id/password ao submeter senha válida', async () => {
    mockFetch
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
      const postCall = mockFetch.mock.calls.find(
        ([url, opts]) => url.includes('/password') && opts?.method === 'POST'
      );
      expect(postCall).toBeTruthy();
      expect(JSON.parse(postCall[1].body)).toEqual({ password: 'NovaSenha123' });
    });
  });

  it('fecha modal após sucesso', async () => {
    mockFetch
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
    mockFetch
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

describe('AdminAlunosPage — aval de patente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ students: mockStudents, pendingRegistration: [] }),
    });
  });

  it('promove o aluno pela função do servidor', async () => {
    renderPage();
    const [firstBtn] = await screen.findAllByTitle('Aval de patente');
    await userEvent.click(firstBtn);
    expect(screen.getByText(/Patente — João Silva/i)).toBeTruthy();

    await userEvent.selectOptions(screen.getByLabelText('Patente concedida'), 'comandante');
    await userEvent.type(screen.getByLabelText('Motivo (opcional)'), 'Ajudou colegas');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar patente' }));

    expect(supabase.rpc).toHaveBeenCalledWith('admin_set_rank_promotion', {
      p_user_id: 'uuid-1', p_rank: 'comandante', p_note: 'Ajudou colegas',
    });
  });

  it('oferece as patentes que dependem de aval', async () => {
    renderPage();
    const [firstBtn] = await screen.findAllByTitle('Aval de patente');
    await userEvent.click(firstBtn);
    const options = [...screen.getByLabelText('Patente concedida').querySelectorAll('option')].map((o) => o.value);
    expect(options).toEqual(['', 'primeiro_oficial', 'comandante', 'master']);
  });
});

describe('AdminAlunosPage — ordenação, filtro e aviso de 1 ano', () => {
  const rowNames = () => screen.getAllByTitle('Editar').map((btn) => btn.closest('div[style*="grid"]').textContent.match(/João Silva|Maria Souza/)[0]);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ students: mockStudents, pendingRegistration: [] }),
    });
  });

  it('ordena por nome e inverte ao clicar de novo', async () => {
    renderPage();
    await screen.findAllByTitle('Editar');
    expect(rowNames()).toEqual(['João Silva', 'Maria Souza']); // ingresso mais recente primeiro

    await userEvent.click(screen.getByRole('button', { name: /Ordenar por nome/ }));
    expect(rowNames()).toEqual(['João Silva', 'Maria Souza']);
    await userEvent.click(screen.getByRole('button', { name: /Ordenar por nome, crescente/ }));
    expect(rowNames()).toEqual(['Maria Souza', 'João Silva']);

    await userEvent.click(screen.getByRole('button', { name: /Ordenar por ingresso/ }));
    await userEvent.click(screen.getByRole('button', { name: /Ordenar por ingresso, decrescente/ }));
    expect(rowNames()).toEqual(['Maria Souza', 'João Silva']); // mais antigo primeiro
  });

  it('mostra a data de ingresso em coluna própria e filtra por ela', async () => {
    renderPage();
    await screen.findAllByTitle('Editar');
    expect(screen.getByText(new Date('2026-04-03T12:00:00Z').toLocaleDateString('pt-BR'))).toBeTruthy();

    await userEvent.type(screen.getByLabelText('Ingresso de'), '2026-04-03');
    expect(rowNames()).toEqual(['João Silva']);
    expect(screen.getByText('Mostrando 1 de 2 alunos.')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Limpar datas' }));
    expect(rowNames()).toHaveLength(2);
  });

  it('avisa quem completa 1 ano nos próximos 30 dias', async () => {
    const soon = new Date();
    soon.setFullYear(soon.getFullYear() - 1);
    soon.setDate(soon.getDate() + 10);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ students: [{ ...mockStudents[0], created_at: soon.toISOString() }, mockStudents[1]], pendingRegistration: [] }),
    });
    renderPage();
    const notice = await screen.findByRole('region', { name: /1 ano de plataforma nos próximos 30 dias · 1 aluno/ });
    expect(notice.textContent).toContain('João Silva');
    expect(notice.textContent).toContain('em 10 dias');
    expect(notice.textContent).not.toContain('Maria Souza');
  });

  it('não mostra o aviso quando ninguém está perto de 1 ano', async () => {
    renderPage();
    await screen.findAllByTitle('Editar');
    expect(screen.queryByRole('region', { name: /1 ano de plataforma/ })).toBeNull();
  });
});

describe('AdminAlunosPage — pontos e alerta de inatividade', () => {
  const longAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ students: mockStudents, pendingRegistration: [] }),
    });
  });

  function mockOverview(rows) {
    /** @type {import('vitest').Mock} */ (/** @type {unknown} */ (supabase.rpc)).mockImplementation((name) =>
      Promise.resolve({ data: name === 'admin_student_overview' ? rows : null, error: null }));
  }

  it('mostra os pontos e destaca em vermelho quem não acessa há mais de 30 dias', async () => {
    mockOverview([
      { user_id: 'uuid-1', points: 120, inactive_since: longAgo, alert_note: null },
      { user_id: 'uuid-2', points: 35, inactive_since: new Date().toISOString(), alert_note: null },
    ]);
    renderPage();
    expect(await screen.findByText('Sem acesso há 45 dias')).toBeTruthy();
    expect(screen.getByText('120')).toBeTruthy();
    expect(screen.getByText('35')).toBeTruthy();
    expect(document.querySelectorAll('[data-inactive="true"]')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toContain('1 aluno sem acessar a plataforma há mais de 30 dias');
  });

  it('desativa o alerta com uma observação', async () => {
    mockOverview([{ user_id: 'uuid-1', points: 0, inactive_since: longAgo, alert_note: null }]);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Desativar alerta' }));
    await userEvent.type(screen.getByLabelText('Observação'), 'Em viagem');
    await userEvent.click(screen.getAllByRole('button', { name: 'Desativar alerta' }).at(-1));
    expect(supabase.rpc).toHaveBeenCalledWith('admin_set_inactivity_alert', { p_user_id: 'uuid-1', p_note: 'Em viagem' });
  });

  it('alerta desativado mostra a observação, sem vermelho', async () => {
    mockOverview([{ user_id: 'uuid-1', points: 0, inactive_since: longAgo, alert_note: 'Em viagem' }]);
    renderPage();
    expect(await screen.findByText('Alerta de inatividade desativado: Em viagem')).toBeTruthy();
    expect(document.querySelectorAll('[data-inactive="true"]')).toHaveLength(0);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
