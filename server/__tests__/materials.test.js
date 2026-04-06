import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('../adapters/s3-adapter.js', () => ({
  S3Adapter: vi.fn(function () { return mockS3; }),
}));

vi.mock('../config.js', () => ({
  SUPABASE_URL: 'https://fake.supabase.co',
  SUPABASE_SERVICE_KEY: 'fake-service-key',
}));

const mockS3 = {
  getUploadUrl: vi.fn(),
  getDownloadUrl: vi.fn(),
};

const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
};

// ── Import após mocks ─────────────────────────────────────────
const { default: materialsRouter } = await import('../routes/materials.js');
import express from 'express';
import request from 'supertest';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/materials', materialsRouter);
  return app;
}

// ── Testes ───────────────────────────────────────────────────
describe('POST /api/materials/upload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 quando campos obrigatórios estão ausentes', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/materials/upload').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatórios/i);
  });

  it('retorna uploadUrl e s3Key quando payload válido', async () => {
    mockS3.getUploadUrl.mockResolvedValue('https://s3.amazonaws.com/fake-presigned-url');
    mockSupabase.insert.mockResolvedValue({ error: null });

    const app = buildApp();
    const res = await request(app).post('/api/materials/upload').send({
      fileName: 'aula1.pdf',
      contentType: 'application/pdf',
      title: 'Aula 1 — Introdução',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uploadUrl');
    expect(res.body).toHaveProperty('s3Key');
    expect(res.body.uploadUrl).toBe('https://s3.amazonaws.com/fake-presigned-url');
    expect(res.body.s3Key).toMatch(/^materials\/.+\.pdf$/);
  });

  it('retorna 500 quando Supabase falha ao inserir', async () => {
    mockS3.getUploadUrl.mockResolvedValue('https://s3.fake/url');
    mockSupabase.insert.mockResolvedValue({ error: new Error('DB error') });

    const app = buildApp();
    const res = await request(app).post('/api/materials/upload').send({
      fileName: 'doc.pdf',
      contentType: 'application/pdf',
      title: 'Documento',
    });

    expect(res.status).toBe(500);
  });
});

describe('GET /api/materials/:id/download', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 404 quando material não encontrado', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: new Error('not found') });

    const app = buildApp();
    const res = await request(app).get('/api/materials/nonexistent-id/download');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrado/i);
  });

  it('retorna downloadUrl quando material existe', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { s3_key: 'materials/abc123.pdf', title: 'Aula 1' },
      error: null,
    });
    mockS3.getDownloadUrl.mockResolvedValue('https://s3.amazonaws.com/fake-download-url?X-Amz=abc');

    const app = buildApp();
    const res = await request(app).get('/api/materials/valid-uuid/download');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('downloadUrl');
    expect(res.body.downloadUrl).toContain('https://s3.amazonaws.com');
    expect(res.body.title).toBe('Aula 1');
    expect(mockS3.getDownloadUrl).toHaveBeenCalledWith('materials/abc123.pdf');
  });
});
