import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signIn: vi.fn(),
  updateUser: vi.fn(),
  createUser: vi.fn(),
  hasPayment: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((_url, key) => {
    if (key === 'anon-key') return { auth: { signInWithPassword: mocks.signIn } };
    return {
      auth: {
        getUser: mocks.getUser,
        admin: { updateUserById: mocks.updateUser, createUser: mocks.createUser },
      },
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ maybeSingle: mocks.hasPayment }) }),
        }),
      }),
    };
  }),
}));

import firstPassword from '../auth/first-password.js';
import register from '../auth/register.js';
import { requireAuthenticatedUser } from '../../server/lib/auth.js';

const user = { id: 'primeiro-acesso', email: 'aluno@example.com', app_metadata: { role: 'admin', password_change_required: true } };

function response() {
  return {
    statusCode: 200,
    body: null,
    setHeader: vi.fn(),
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function request(password = 'NovaSenha1!', currentPassword = 'senha-temp') {
  return { method: 'POST', headers: { authorization: 'Bearer token-test' }, body: { password, currentPassword } };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
  vi.stubEnv('SUPABASE_SERVICE_KEY', 'service-key');
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.signIn.mockResolvedValue({ data: { user }, error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
});

afterEach(() => vi.unstubAllEnvs());

describe('troca de senha no primeiro acesso', () => {
  it.each(['Abc1!', 'ABCD123!', 'abcd123!', 'Abcdefg!', 'Abc12345', 'Abc1234 '])(
    'recusa senha que não cumpre um requisito (%s)',
    async (password) => {
      const res = response();
      await firstPassword(request(password), res);
      expect(res.statusCode).toBe(400);
      expect(mocks.signIn).not.toHaveBeenCalled();
      expect(mocks.updateUser).not.toHaveBeenCalled();
    },
  );

  it('recusa reutilizar a senha atual', async () => {
    const res = response();
    await firstPassword(request('Igual123!', 'Igual123!'), res);
    expect(res.statusCode).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('uma sessão válida precisa confirmar a senha atual da mesma conta', async () => {
    mocks.signIn.mockResolvedValue({ data: { user: null }, error: { code: 'invalid_credentials' } });
    const res = response();
    await firstPassword(request(), res);
    expect(res.statusCode).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('exige autenticação e não altera senha de outra conta', async () => {
    const res = response();
    await firstPassword({ ...request(), headers: {} }, res);
    expect(res.statusCode).toBe(401);
    expect(mocks.updateUser).not.toHaveBeenCalled();

    mocks.signIn.mockResolvedValue({ data: { user: { ...user, id: 'outra-conta' } }, error: null });
    const mismatch = response();
    await firstPassword(request(), mismatch);
    expect(mismatch.statusCode).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('atualiza senha e pendência de uma vez para o usuário autenticado', async () => {
    const req = request('Sênha123+');
    const res = response();
    await firstPassword({ ...req, body: { ...req.body, userId: 'ignorado' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(mocks.signIn).toHaveBeenCalledWith({ email: user.email, password: 'senha-temp' });
    expect(mocks.updateUser).toHaveBeenCalledExactlyOnceWith(user.id, {
      password: 'Sênha123+',
      app_metadata: { password_change_required: false },
    });
  });

  it('não confirma a troca quando o Auth falha', async () => {
    mocks.updateUser.mockResolvedValue({ error: { code: 'unexpected_failure' } });
    const res = response();
    await firstPassword(request(), res);
    expect(res.statusCode).toBe(503);
    expect(res.body.ok).toBeUndefined();
  });

  it('contas sem pendência seguem no fluxo normal e não usam a troca de primeiro acesso', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { ...user, app_metadata: { role: 'admin' } } }, error: null });
    const res = response();
    await firstPassword(request(), res);
    expect(res.statusCode).toBe(409);
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(await requireAuthenticatedUser(request(), response(), { requireAdmin: true })).toMatchObject({ id: user.id });
  });

  it('o middleware bloqueia a API protegida enquanto a troca estiver pendente', async () => {
    const res = response();
    expect(await requireAuthenticatedUser(request(), res, { requireAdmin: true })).toBeNull();
    expect(res.statusCode).toBe(403);
  });
});

it('registra a pendência no Auth também no autocadastro com pagamento confirmado', async () => {
  mocks.hasPayment.mockResolvedValue({ data: { id: 'pagamento', status: 'PAID', email: user.email }, error: null });
  mocks.createUser.mockResolvedValue({ data: { user }, error: null });
  const res = response();
  await register({ method: 'POST', body: { email: user.email, password: 'senha-temp' } }, res);
  expect(res.statusCode).toBe(201);
  expect(mocks.createUser).toHaveBeenCalledWith(expect.objectContaining({
    email: user.email,
    app_metadata: { password_change_required: true },
  }));
});
