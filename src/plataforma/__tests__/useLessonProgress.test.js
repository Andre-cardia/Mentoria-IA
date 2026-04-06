import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────

const mockUser = { id: 'user-123' };

// Resultado padrão do SELECT — mutável por teste
let mockSelectResult = { data: [], error: null };

// Mock chainable: from().select().eq() → Promise
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(mockSelectResult)),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

// ── Import após mocks ─────────────────────────────────────────
const { useLessonProgress } = await import('../hooks/useLessonProgress.js');

// ── Testes ───────────────────────────────────────────────────

describe('useLessonProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult = { data: [], error: null };
  });

  it('isComplete retorna false para aula não concluída', async () => {
    mockSelectResult = { data: [], error: null };
    const { result } = renderHook(() => useLessonProgress());
    await act(async () => {});
    expect(result.current.isComplete('lesson-abc')).toBe(false);
  });

  it('isComplete retorna true após markComplete (optimistic update)', async () => {
    mockSelectResult = { data: [], error: null };
    const { result } = renderHook(() => useLessonProgress());
    await act(async () => {});

    await act(async () => {
      await result.current.markComplete('lesson-abc');
    });

    expect(result.current.isComplete('lesson-abc')).toBe(true);
  });

  it('getModuleProgress retorna completed=0 quando nenhuma aula foi concluída', async () => {
    mockSelectResult = { data: [], error: null };
    const { result } = renderHook(() => useLessonProgress());
    await act(async () => {});

    const lessons = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }];
    const progress = result.current.getModuleProgress('mod-1', lessons);

    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(0);
  });

  it('getTotalProgress conta aulas concluídas em múltiplos módulos', async () => {
    mockSelectResult = {
      data: [{ lesson_id: 'l1' }, { lesson_id: 'l3' }],
      error: null,
    };

    const { result } = renderHook(() => useLessonProgress());
    await act(async () => {});

    const modules = [
      { id: 'm1', lessons: [{ id: 'l1' }, { id: 'l2' }] },
      { id: 'm2', lessons: [{ id: 'l3' }, { id: 'l4' }] },
    ];

    const total = result.current.getTotalProgress(modules);
    expect(total.total).toBe(4);
    expect(total.completed).toBe(2);
  });
});
