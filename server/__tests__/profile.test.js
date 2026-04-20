import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'fake-service-key';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('../adapters/s3-adapter.js', () => ({
  S3Adapter: vi.fn(function () { return mockS3; }),
}));

vi.mock('../config.js', () => ({
  SUPABASE_URL: 'https://fake.supabase.co',
  SUPABASE_SERVICE_KEY: 'fake-service-key',
  AWS_BUCKET: 'mentoria-bucket',
  AWS_REGION: 'us-east-1',
}));

const mockS3 = {
  getUploadUrl: vi.fn(),
};

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
  update: vi.fn(() => mockSupabase),
  insert: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

const { default: profileRouter } = await import('../routes/profile.js');
import express from 'express';
import request from 'supertest';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/profile', profileRouter);
  return app;
}

describe('POST /api/profile/avatar-upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'student-user' } },
      error: null,
    });
  });

  it('retorna 401 sem bearer token', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/profile/avatar-upload').send({});

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token/i);
  });

  it('retorna 400 para contentType não suportado', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/profile/avatar-upload')
      .set('Authorization', 'Bearer valid-token')
      .send({ fileName: 'avatar.gif', contentType: 'image/gif' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/formato não suportado/i);
  });

  it('retorna uploadUrl e avatarUrl quando payload é válido', async () => {
    mockS3.getUploadUrl.mockResolvedValue('https://s3.fake/upload');

    const app = buildApp();
    const res = await request(app)
      .post('/api/profile/avatar-upload')
      .set('Authorization', 'Bearer valid-token')
      .send({ fileName: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.uploadUrl).toBe('https://s3.fake/upload');
    expect(res.body.avatarUrl).toBe('https://mentoria-bucket.s3.us-east-1.amazonaws.com/avatars/student-user.png');
    expect(mockS3.getUploadUrl).toHaveBeenCalledWith('avatars/student-user.png', 'image/png');
  });
});

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'student-user' } },
      error: null,
    });
  });

  it('retorna 401 quando token é inválido', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('invalid'),
    });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/profile')
      .set('Authorization', 'Bearer invalid-token')
      .send({ full_name: 'Aluno Teste' });

    expect(res.status).toBe(401);
  });

  it('atualiza perfil do usuário autenticado', async () => {
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockResolvedValue({ error: null });

    const app = buildApp();
    const res = await request(app)
      .patch('/api/profile')
      .set('Authorization', 'Bearer valid-token')
      .send({ full_name: 'Aluno Teste', phone: '48999999999' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'student-user');
  });
});

describe('POST /api/profile/update-avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
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

  it('retorna 400 quando avatarUrl está ausente', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/profile/update-avatar')
      .set('Authorization', 'Bearer valid-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/avatarUrl/i);
  });

  it('atualiza avatar quando profile já existe', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { user_id: 'student-user' },
      error: null,
    });
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ error: null });

    const app = buildApp();
    const res = await request(app)
      .post('/api/profile/update-avatar')
      .set('Authorization', 'Bearer valid-token')
      .send({ avatarUrl: 'https://cdn.test/avatar.png' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockSupabase.update).toHaveBeenCalled();
  });

  it('cria profile quando ainda não existe', async () => {
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.insert.mockResolvedValue({ error: null });

    const app = buildApp();
    const res = await request(app)
      .post('/api/profile/update-avatar')
      .set('Authorization', 'Bearer valid-token')
      .send({ avatarUrl: 'https://cdn.test/avatar.png' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      user_id: 'student-user',
      full_name: 'Aluno Teste',
      avatar_url: 'https://cdn.test/avatar.png',
    });
  });
});
