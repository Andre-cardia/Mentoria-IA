import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'fake-service-key';

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

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

const { default: studentsHandler } = await import('../admin/students.js');
const { default: studentByIdHandler } = await import('../admin/students/[id].js');
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
      data: { user: { id: 'admin-user', user_metadata: { role: 'admin' } } },
      error: null,
    });
  });

  it('retorna 403 quando usuário não é admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'student-user', user_metadata: { role: 'student' } } },
      error: null,
    });

    const req = { method: 'GET', headers: { authorization: 'Bearer valid-token' } };
    const res = createRes();

    await studentsHandler(req, res);

    expect(res.statusCode).toBe(403);
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
  });
});

describe('api/admin/students/[id] handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user', user_metadata: { role: 'admin' } } },
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
      data: { user: { id: 'admin-user', user_metadata: { role: 'admin' } } },
      error: null,
    });
  });

  it('lista somente usuários admin e comercial', async () => {
    mockSupabase.auth.admin.listUsers.mockResolvedValue({
      data: {
        users: [
          { id: 'admin-1', email: 'admin@test.com', user_metadata: { role: 'admin', full_name: 'Admin' }, created_at: '2026-04-27' },
          { id: 'sales-1', email: 'comercial@test.com', user_metadata: { role: 'comercial', full_name: 'Comercial' }, created_at: '2026-04-27' },
          { id: 'student-1', email: 'aluno@test.com', user_metadata: { role: 'aluno', full_name: 'Aluno' }, created_at: '2026-04-27' },
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
      data: { user: { id: 'sales-1', email: 'sales@test.com', user_metadata: { role: 'comercial', full_name: 'Sales' } } },
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
      user_metadata: { full_name: 'Sales', role: 'comercial' },
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
      data: { user: { id: 'admin-user', user_metadata: { role: 'admin' } } },
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
      data: { user: { id: 'sales-1', user_metadata: { role: 'comercial', theme: 'dark' } } },
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
      user_metadata: { role: 'admin', theme: 'dark', full_name: 'Comercial Novo' },
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
