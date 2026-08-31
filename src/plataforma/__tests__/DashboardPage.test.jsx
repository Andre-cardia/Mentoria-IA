import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  responses: {},
  queries: new Map(),
}));

function createQuery(table) {
  const result = () => mocks.responses[table] ?? { data: [], error: null };
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result())),
    then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
  };

  const tableQueries = mocks.queries.get(table) ?? [];
  tableQueries.push(query);
  mocks.queries.set(table, tableQueries);
  return query;
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'student-1',
      email: 'aluno@example.com',
      user_metadata: { full_name: 'Aluno Teste' },
    },
  }),
}));

vi.mock('../hooks/useLessonProgress', () => ({
  useLessonProgress: () => ({
    completedIds: new Set(),
    getTotalProgress: () => ({ completed: 0, total: 0 }),
  }),
}));

vi.mock('../components/Layout', () => ({
  default: ({ children }) => <main>{children}</main>,
}));

vi.mock('../components/DashboardStats', () => ({
  default: () => <div>Resumo do aluno</div>,
}));

vi.mock('../components/AdminAnnouncements', () => ({
  default: () => <div>Avisos do administrador</div>,
}));

import DashboardPage from '../pages/DashboardPage';

function lesson(number) {
  return {
    id: `lesson-${number}`,
    title: `Aula recente ${number}`,
    lesson_type: 'video',
    video_url: null,
    module_id: 'module-1',
    modules: { title: 'Módulo de teste' },
  };
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage — Últimos Lançamentos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queries.clear();
    mocks.responses = {
      profiles: { data: { full_name: 'Aluno Teste' }, error: null },
      lesson_progress: { data: [], error: null },
      modules: { data: [], error: null },
      lessons: { data: [], error: null },
      posts: { data: [], error: null },
    };
    mocks.from.mockImplementation(createQuery);
    mocks.rpc.mockResolvedValue({ data: [], error: null });
  });

  it('solicita as 12 aulas mais recentes e renderiza todos os cards retornados', async () => {
    mocks.responses.lessons = {
      data: Array.from({ length: 12 }, (_, index) => lesson(index + 1)),
      error: null,
    };

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Aula recente 12')).toBeInTheDocument();
    });

    const lessonsQuery = mocks.queries.get('lessons')[0];
    expect(lessonsQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(lessonsQuery.limit).toHaveBeenCalledWith(12);
    expect(screen.getAllByText(/^Aula recente \d+$/)).toHaveLength(12);
    expect(screen.getAllByText('Vídeo')).toHaveLength(12);
    expect(screen.getByRole('link', { name: /Aula recente 1\b(?!\d)/i })).toHaveAttribute(
      'href',
      '/modulos/module-1/aulas/lesson-1',
    );
  });

  it('renderiza somente as aulas disponíveis quando a consulta retorna menos de 12', async () => {
    mocks.responses.lessons = {
      data: [lesson(1), lesson(2), lesson(3)],
      error: null,
    };

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Aula recente 3')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/^Aula recente \d+$/)).toHaveLength(3);
    expect(screen.queryByText('Aula recente 4')).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhuma aula disponível ainda.')).not.toBeInTheDocument();
  });

  it('exibe o estado vazio sem criar cards quando nenhuma aula está disponível', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Nenhuma aula disponível ainda.')).toBeInTheDocument();
    });

    expect(screen.queryByText(/^Aula recente \d+$/)).not.toBeInTheDocument();
  });
});
