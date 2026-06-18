import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'fake-service-key';

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    admin: {
      updateUserById: vi.fn(),
    },
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

const { default: passwordHandler } = await import('../admin/students/[id]/password.js');

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

describe('api/admin/students/[id]/password handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-user', user_metadata: { role: 'admin' } } },
      error: null,
    });
    mockSupabase.auth.admin.updateUserById.mockResolvedValue({ error: null });
  });

  it('redefine senha com sucesso (POST, token admin, senha válida)', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'student-uuid' },
      body: { password: 'NovaSenha123' },
    };
    const res = createRes();

    await passwordHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('student-uuid', { password: 'NovaSenha123' });
  });

  it('retorna 403 sem token de autorização', async () => {
    const req = {
      method: 'POST',
      headers: {},
      query: { id: 'student-uuid' },
      body: { password: 'NovaSenha123' },
    };
    const res = createRes();

    await passwordHandler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Acesso negado' });
  });

  it('retorna 403 quando token não é de admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-id', user_metadata: { role: 'aluno' } } },
      error: null,
    });

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer non-admin-token' },
      query: { id: 'student-uuid' },
      body: { password: 'NovaSenha123' },
    };
    const res = createRes();

    await passwordHandler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Acesso negado' });
  });

  it('retorna 400 quando password está ausente', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'student-uuid' },
      body: {},
    };
    const res = createRes();

    await passwordHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Senha deve ter pelo menos 8 caracteres' });
  });

  it('retorna 400 quando password tem menos de 8 caracteres', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'student-uuid' },
      body: { password: 'abc' },
    };
    const res = createRes();

    await passwordHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Senha deve ter pelo menos 8 caracteres' });
  });

  it('retorna 500 quando Supabase retorna erro', async () => {
    mockSupabase.auth.admin.updateUserById.mockResolvedValue({
      error: new Error('Supabase internal error'),
    });

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'student-uuid' },
      body: { password: 'NovaSenha123' },
    };
    const res = createRes();

    await passwordHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Erro ao redefinir senha' });
  });

  it('retorna 405 para método não permitido', async () => {
    const req = {
      method: 'GET',
      headers: { authorization: 'Bearer valid-token' },
      query: { id: 'student-uuid' },
      body: {},
    };
    const res = createRes();

    await passwordHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method not allowed' });
  });
});
