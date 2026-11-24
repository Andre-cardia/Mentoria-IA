import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError } from '@supabase/supabase-js';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/useAuth';
import { GESTAO_BASE } from '../../lib/app-env';
import AdminRoute from '../components/AdminRoute';
import LoginPage from '../pages/LoginPage';

vi.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: true,
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
    <MemoryRouter basename={GESTAO_BASE} initialEntries={[`${GESTAO_BASE}/admin/alunos`]}>
      <AuthContext.Provider value={fakeAuthValue}>
        <Routes>
          <Route path="/admin/alunos" element={<AdminRoute><AdminAlunosPage /></AdminRoute>} />
          <Route path="/login" element={<LoginPage area="gestao" />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('AdminAlunosPage — carregamento da lista', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  function expectNoList() {
    expect(screen.queryByText(/\d+ alunos? cadastrados?|Nenhum aluno cadastrado/)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Buscar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Novo aluno/ })).not.toBeInTheDocument();
  }

  it('mostra carregamento sem indicar que a lista está vazia', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expectNoList();
    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());
  });

  it.each([
    ['não há sessão', null],
    ['o SDK não encontra a sessão', new AuthSessionMissingError()],
    ['o Auth recusou a renovação', new AuthApiError('Refresh token missing', 400, 'refresh_token_not_found')],
  ])('pede novo login sem consultar a API quando %s', async (_, error) => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({ data: { session: null }, error });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Entre novamente na Gestão');
    expect(screen.getByRole('link', { name: 'Ir para o login da Gestão' })).toHaveAttribute('href', '/gestao/login');
    expect(mockFetch).not.toHaveBeenCalled();
    expectNoList();
  });

  it('navega para o login da Gestão quando a API retorna 401', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Entre novamente na Gestão');
    expectNoList();
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/students', expect.objectContaining({
      headers: { Authorization: 'Bearer fake-token' },
    }));
    await userEvent.click(screen.getByRole('link', { name: 'Ir para o login da Gestão' }));

    expect(await screen.findByRole('heading', { name: 'Gestão — admin e comercial' })).toBeInTheDocument();
  });

  it('mostra recusa de acesso quando a API retorna 403', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso negado');
    expect(screen.queryByRole('link', { name: 'Ir para o login da Gestão' })).not.toBeInTheDocument();
    expectNoList();
  });

  it('permite tentar novamente se o SDK falhar ao obter a sessão', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null }, error: new AuthRetryableFetchError('Network failure', 0),
    });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a lista de alunos.');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
    expectNoList();
  });

  it.each([
    ['HTTP 503', () => new Response('temporariamente fora do ar', { status: 503 })],
    ['falha de rede', () => { throw new TypeError('Failed to fetch'); }],
    ['JSON inválido', () => new Response('<!doctype html>')],
    ['envelope inválido', () => Response.json({ students: [] })],
    ['registro inválido', () => Response.json({ students: [null], pendingRegistration: [] })],
    ['nome com tipo inválido', () => Response.json({
      students: [{ ...mockStudents[0], full_name: { value: 'João Silva' } }], pendingRegistration: [],
    })],
    ['plano com tipo inválido', () => Response.json({
      students: [], pendingRegistration: [{ email: 'comprador@example.com', plan: ['mensal'] }],
    })],
  ])('mostra erro em caso de %s e recupera a lista ao tentar novamente', async (_, failedResponse) => {
    mockFetch
      .mockImplementationOnce(async () => failedResponse())
      .mockResolvedValueOnce(Response.json({ students: mockStudents, pendingRegistration: [] }));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a lista de alunos.');
    expectNoList();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('João Silva')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Buscar' })).toBeInTheDocument();
    expect(screen.getAllByTitle('Redefinir senha')).toHaveLength(mockStudents.length);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('mostra o estado vazio somente quando a consulta devolve listas válidas sem registros', async () => {
    mockFetch.mockResolvedValueOnce(Response.json({ students: [], pendingRegistration: [] }));
    renderPage();

    expect(await screen.findByText('Nenhum aluno cadastrado.')).toBeInTheDocument();
    expect(screen.getByText('0 alunos cadastrados')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('recupera a lista após HTTP 500 e permite cadastrar um comprador pendente', async () => {
    mockFetch
      .mockResolvedValueOnce(Response.json({ error: 'Erro ao buscar perfis' }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({
        students: [{ ...mockStudents[0], email: null, phone: null, created_at: null }],
        pendingRegistration: [{
          email: 'comprador@example.com', plan: null, amount: '49700', purchased_at: '2026-04-16',
        }],
      }));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a lista de alunos.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('1 aguardando cadastro')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Aguardando cadastro/ }));
    expect(screen.getByText('comprador@example.com')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*497,00/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByPlaceholderText('email@exemplo.com')).toHaveValue('comprador@example.com');
  });

  it.each([500, 401])('preserva o rascunho durante a recarga e trata HTTP %s', async (status) => {
    let completeUpdate;
    let completeReload;
    mockFetch
      .mockResolvedValueOnce(Response.json({ students: mockStudents, pendingRegistration: [] }))
      .mockImplementationOnce(() => new Promise((resolve) => { completeUpdate = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { completeReload = resolve; }))
      .mockResolvedValueOnce(Response.json({ students: mockStudents, pendingRegistration: [] }));
    renderPage();

    const [suspend] = await screen.findAllByTitle('Suspender');
    await userEvent.click(suspend);
    await userEvent.click(screen.getAllByTitle('Editar')[1]);
    const field = screen.getByPlaceholderText('Nome completo');
    await userEvent.clear(field);
    await userEvent.type(field, 'Nome em edição');

    await act(async () => { completeUpdate(Response.json({ ok: true })); });
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(field).not.toBeVisible();
    expect(field).toHaveValue('Nome em edição');

    await act(async () => { completeReload(new Response(null, { status })); });
    if (status === 401) {
      expect(screen.getByRole('alert')).toHaveTextContent('Entre novamente na Gestão');
      expect(field).not.toBeInTheDocument();
      expectNoList();
      return;
    }

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar a lista de alunos.');
    expect(field).not.toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'Editar aluno' })).toBeVisible();
    expect(screen.getByPlaceholderText('Nome completo')).toHaveValue('Nome em edição');
  });

  it('preserva o aviso de sessão do GET mais recente quando o GET anterior termina depois', async () => {
    let completeFirstUpdate;
    let completeSecondUpdate;
    let completeFirstReload;
    mockFetch
      .mockResolvedValueOnce(Response.json({ students: mockStudents, pendingRegistration: [] }))
      .mockImplementationOnce(() => new Promise((resolve) => { completeFirstUpdate = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { completeSecondUpdate = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { completeFirstReload = resolve; }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    renderPage();

    const [first, second] = await screen.findAllByTitle('Suspender');
    await userEvent.click(first);
    await userEvent.click(second);
    await act(async () => { completeFirstUpdate(Response.json({ ok: true })); });
    await act(async () => { completeSecondUpdate(Response.json({ ok: true })); });
    expect(await screen.findByRole('alert')).toHaveTextContent('Entre novamente na Gestão');

    await act(async () => { completeFirstReload(Response.json({ students: mockStudents, pendingRegistration: [] })); });
    expect(screen.getByRole('alert')).toHaveTextContent('Entre novamente na Gestão');
    expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
    expectNoList();
  });
});

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
