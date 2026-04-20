import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'fake-service-key';

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  maybeSingle: vi.fn(),
  update: vi.fn(() => mockSupabase),
  insert: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

const { default: handler } = await import('../profile/update-avatar.js');

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

describe('api/profile/update-avatar handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'student-user',
          email: 'student@test.com',
          user_metadata: { full_name: 'Aluno Teste' },
        },
      },
      error: null,
    });
  });

  it('retorna 405 para método diferente de POST', async () => {
    const req = { method: 'GET', body: {}, headers: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });

  it('retorna 401 sem token', async () => {
    const req = { method: 'POST', body: { avatarUrl: 'https://cdn.test/avatar.png' }, headers: {} };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it('atualiza avatar quando profile existe', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { user_id: 'student-user' },
      error: null,
    });
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockResolvedValue({ error: null });

    const req = {
      method: 'POST',
      body: { avatarUrl: 'https://cdn.test/avatar.png' },
      headers: { authorization: 'Bearer valid-token' },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('cria profile quando ainda não existe', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.insert.mockResolvedValue({ error: null });

    const req = {
      method: 'POST',
      body: { avatarUrl: 'https://cdn.test/avatar.png' },
      headers: { authorization: 'Bearer valid-token' },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(mockSupabase.insert).toHaveBeenCalled();
  });
});
