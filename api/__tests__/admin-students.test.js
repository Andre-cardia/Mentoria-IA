import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError, createClient } from '@supabase/supabase-js';

process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'fake-service-key';

/** @type {Record<string, any>} */
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  order: vi.fn(),
  eq: vi.fn(() => mockSupabase),
  not: vi.fn(() => mockSupabase),
  insert: vi.fn(),
  update: vi.fn(() => mockSupabase),
  auth: {
    getUser: vi.fn(),
    admin: {
      listUsers: vi.fn(),
      createUser: vi.fn(),
      getUserById: vi.fn(),
      updateUserById: vi.fn(),
      deleteUser: vi.fn(),
    },
  },
};

vi.mock('@supabase/supabase-js', async () => ({
  ...await vi.importActual('@supabase/supabase-js'),
  createClient: vi.fn(() => mockSupabase),
}));

const { default: studentsHandler } = await import('../admin/students.js');
const { default: studentByIdHandler } = await import('../admin/students/[id]/index.js');
const { default: platformUsersHandler } = await import('../admin/platform-users.js');
const { default: platformUserByIdHandler } = await import('../admin/platform-users/[id].js');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('api/admin/students handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.not.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user', app_metadata: { role: 'admin' } } },
      error: null,
    });
  });

  it.each([{}, { authorization: 'Basic valid-token' }, { authorization: 'Bearer ' }])(
    'retorna 401 sem um token Bearer em %j',
    async (headers) => {
      const res = createRes();

      await studentsHandler({ method: 'GET', headers }, res);

      expect(res.statusCode).toBe(401);
      expect(createClient).not.toHaveBeenCalled();
      expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    },
  );

  it.each([
    new AuthSessionMissingError(),
    new AuthApiError('Invalid JWT', 403, 'bad_jwt'),
    new AuthApiError('Session not found', 400, 'session_not_found'),
    new AuthApiError('User not found', 404, 'user_not_found'),
  ])('retorna 401 quando o Auth rejeita a sessão ($message)', async (error) => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error });
    const res = createRes();

    await studentsHandler({ method: 'GET', headers: { authorization: 'Bearer stale-token' } }, res);

    expect(res.statusCode).toBe(401);
    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('stale-token');
    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(mockSupabase.auth.admin.listUsers).not.toHaveBeenCalled();
  });

  it.each([
    new AuthRetryableFetchError('Network failure', 0),
    new AuthApiError('Invalid API key', 401, undefined),
    new AuthApiError('Gateway blocked the request', 403, undefined),
    new AuthApiError('Rate limited', 429, 'over_request_rate_limit'),
    new AuthApiError('Unavailable', 500, 'unexpected_failure'),
  ])('retorna 503 quando o Auth falha ($message)', async (error) => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error });
    const res = createRes();

    await studentsHandler({ method: 'GET', headers: { authorization: 'Bearer valid-token' } }, res);

    expect(res.statusCode).toBe(503);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('retorna 503 se a consulta ao Auth lançar uma exceção', async () => {
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Network failure'));
    const res = createRes();

    await studentsHandler({ method: 'GET', headers: { authorization: 'Bearer valid-token' } }, res);

    expect(res.statusCode).toBe(503);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('retorna 503 quando a resposta do Auth não contém uma conta autenticada', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = createRes();

    await studentsHandler({ method: 'GET', headers: { authorization: 'Bearer valid-token' } }, res);

    expect(res.statusCode).toBe(503);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('retorna 503 quando o cliente do Auth não pode ser configurado', async () => {
    vi.mocked(createClient).mockImplementationOnce(() => { throw new Error('Invalid Supabase configuration'); });
    const res = createRes();

    await studentsHandler({ method: 'GET', headers: { authorization: 'Bearer valid-token' } }, res);

    expect(res.statusCode).toBe(503);
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('retorna 403 quando a conta autenticada não tem papel administrativo', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'student-user', app_metadata: { role: 'student' }, user_metadata: { role: 'admin' } } },
      error: null,
    });

    const req = { method: 'GET', headers: { authorization: 'Bearer valid-token' } };
    const res = createRes();

    await studentsHandler(req, res);

    expect(res.statusCode).toBe(403);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('retorna as duas listas vazias depois de uma consulta válida', async () => {
    mockSupabase.order.mockResolvedValue({ data: [], error: null });
    mockSupabase.auth.admin.listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    const res = createRes();

    await studentsHandler({ method: 'GET', headers: { authorization: 'Bearer valid-token' } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ students: [], pendingRegistration: [] });
  });

  it.each([
    ['profiles', new Error('Lookup failed')], ['users', new Error('Lookup failed')],
    ['payments', new Error('Lookup failed')], ['profiles', null], ['users', null], ['payments', null],
  ])('retorna 500 quando a consulta a %s não entrega dados válidos (%s)', async (source, error) => {
    const failed = { data: null, error };
    mockSupabase.order
      .mockResolvedValueOnce(source === 'profiles' ? failed : { data: [], error: null })
      .mockResolvedValueOnce(source === 'payments' ? failed : { data: [], error: null });
    mockSupabase.auth.admin.listUsers.mockResolvedValue(source === 'users' ? failed : { data: { users: [] }, error: null });
    const res = createRes();

    await studentsHandler({ method: 'GET', headers: { authorization: 'Bearer valid-token' } }, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('retorna erro JSON quando uma leitura rejeita a promessa', async () => {
    mockSupabase.order.mockResolvedValue({ data: [], error: null });
    mockSupabase.auth.admin.listUsers.mockRejectedValue(new SyntaxError('Invalid JSON'));
    const res = createRes();

    await studentsHandler({ method: 'GET', headers: { authorization: 'Bearer valid-token' } }, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('nega acesso à lista para um administrador que ainda precisa trocar a senha', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user', app_metadata: { role: 'admin', password_change_required: true } } },
      error: null,
    });
    const res = createRes();

    await studentsHandler({ method: 'GET', headers: { authorization: 'Bearer valid-token' } }, res);

    expect(res.statusCode).toBe(403);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('lista alunos e compradores pendentes sem duplicar emails', async () => {
    const profilesRes = {
      data: [{ user_id: 'u1', full_name: 'Aluno 1', status: 'active' }],
      error: null,
    };
    const paymentsRes = {
      data: [
        { email: 'novo@test.com', reference_id: 'mensal-1', amount: 49700, created_at: '2026-04-16' },
        { email: 'NOVO@test.com', reference_id: 'mensal-2', amount: 49700, created_at: '2026-04-17' },
        { email: 'existente@test.com', reference_id: 'anual-1', amount: 356140, created_at: '2026-04-18' },
      ],
      error: null,
    };

    mockSupabase.order
      .mockResolvedValueOnce(profilesRes)
      .mockResolvedValueOnce(paymentsRes);
    mockSupabase.auth.admin.listUsers.mockResolvedValue({
      data: { users: [{ id: 'u1', email: 'existente@test.com' }] },
    });

    const req = { method: 'GET', headers: { authorization: 'Bearer valid-token' } };
    const res = createRes();

    await studentsHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.students).toEqual([
      { user_id: 'u1', full_name: 'Aluno 1', status: 'active', email: 'existente@test.com' },
    ]);
    expect(res.body.pendingRegistration).toEqual([
      {
        email: 'novo@test.com',
        plan: 'mensal',
        amount: 49700,
        purchased_at: '2026-04-16',
      },
    ]);
  });

  it('faz rollback do usuário criado quando a criação do profile falha', async () => {
    mockSupabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user' } },
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({ error: new Error('db failed') });

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: {
        email: 'novo@test.com',
        password: '123456',
        full_name: 'Novo Aluno',
      },
    };
    const res = createRes();

    await studentsHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('new-user');
  });

  it('cria aluno com sucesso', async () => {
    mockSupabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user' } },
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({ error: null });

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: {
        email: 'novo@test.com',
        password: '123456',
        full_name: 'Novo Aluno',
        phone: '48999999999',
        origin: 'instagram',
      },
    };
    const res = createRes();

    await studentsHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ ok: true, userId: 'new-user' });
    expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      app_metadata: { password_change_required: true },
    }));
  });
});

describe('api/admin/students/[id] handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user', app_metadata: { role: 'admin' } } },
      error: null,
    });
  });

  it('retorna 400 para status inválido no PATCH', async () => {
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'student-user' },
      body: { status: 'paused' },
    };
    const res = createRes();

    await studentByIdHandler(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('atualiza aluno com sucesso no PATCH', async () => {
    mockSupabase.eq.mockResolvedValue({ error: null });

    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'student-user' },
      body: { full_name: 'Aluno Atualizado', status: 'suspended' },
    };
    const res = createRes();

    await studentByIdHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSupabase.update).toHaveBeenCalled();
  });

  it('remove aluno com sucesso no DELETE', async () => {
    mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null });

    const req = {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'student-user' },
    };
    const res = createRes();

    await studentByIdHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('student-user');
  });
});

describe('api/admin/platform-users handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user', app_metadata: { role: 'admin' } } },
      error: null,
    });
  });

  it('lista somente usuários admin e comercial', async () => {
    mockSupabase.auth.admin.listUsers.mockResolvedValue({
      data: {
        users: [
          { id: 'admin-1', email: 'admin@test.com', app_metadata: { role: 'admin' }, user_metadata: { full_name: 'Admin' }, created_at: '2026-04-27' },
          { id: 'sales-1', email: 'comercial@test.com', app_metadata: { role: 'comercial' }, user_metadata: { full_name: 'Comercial' }, created_at: '2026-04-27' },
          { id: 'student-1', email: 'aluno@test.com', app_metadata: { role: 'aluno' }, user_metadata: { full_name: 'Aluno' }, created_at: '2026-04-27' },
        ],
      },
      error: null,
    });

    const req = { method: 'GET', headers: { authorization: 'Bearer valid-token' } };
    const res = createRes();

    await platformUsersHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users.map((user) => user.role).sort()).toEqual(['admin', 'comercial']);
    expect(res.body.currentUserId).toBe('admin-user');
  });

  it('cria usuário comercial com metadata de role', async () => {
    mockSupabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'sales-1', email: 'sales@test.com', app_metadata: { role: 'comercial' }, user_metadata: { full_name: 'Sales' } } },
      error: null,
    });

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: {
        email: 'sales@test.com',
        password: '123456',
        full_name: 'Sales',
        role: 'comercial',
      },
    };
    const res = createRes();

    await platformUsersHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'sales@test.com',
      password: '123456',
      email_confirm: true,
      user_metadata: { full_name: 'Sales' },
      app_metadata: { role: 'comercial', password_change_required: true },
    });
  });

  it('rejeita role inválido na criação', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: {
        email: 'x@test.com',
        password: '123456',
        full_name: 'X',
        role: 'aluno',
      },
    };
    const res = createRes();

    await platformUsersHandler(req, res);

    expect(res.statusCode).toBe(400);
  });
});

describe('api/admin/platform-users/[id] handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user', app_metadata: { role: 'admin' } } },
      error: null,
    });
  });

  it('impede admin de remover o próprio acesso admin', async () => {
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'admin-user' },
      body: { role: 'comercial' },
    };
    const res = createRes();

    await platformUserByIdHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockSupabase.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it('atualiza metadata preservando campos existentes', async () => {
    mockSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { id: 'sales-1', app_metadata: { role: 'comercial' }, user_metadata: { theme: 'dark' } } },
      error: null,
    });
    mockSupabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'sales-1' },
      body: { full_name: 'Comercial Novo', role: 'admin' },
    };
    const res = createRes();

    await platformUserByIdHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('sales-1', {
      user_metadata: { theme: 'dark', full_name: 'Comercial Novo' },
      app_metadata: { role: 'admin' },
    });
  });

  it('impede excluir o próprio usuário', async () => {
    const req = {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'admin-user' },
    };
    const res = createRes();

    await platformUserByIdHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockSupabase.auth.admin.deleteUser).not.toHaveBeenCalled();
  });
});
