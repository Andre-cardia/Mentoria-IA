import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CursosPage from '../pages/CursosPage';

const mocks = vi.hoisted(() => ({ from: vi.fn(), responses: {} }));

function createQuery(table) {
  const result = () => mocks.responses[table] ?? { data: [], error: null };
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
  };
  return query;
}

vi.mock('../../lib/supabase', () => ({ supabase: { from: mocks.from } }));

vi.mock('../hooks/useLessonProgress', () => ({
  useLessonProgress: () => ({
    getModuleProgress: (moduleId, lessons = []) => ({ moduleId, total: lessons.length, completed: 0 }),
  }),
}));

vi.mock('../components/Layout', () => ({
  default: ({ children }) => <main>{children}</main>,
}));

const MODULES = [
  { id: 'm-prompt', title: 'Engenharia de Prompt', order: 3, track_id: 't-basico', lessons: [{ id: 'l1' }, { id: 'l2' }] },
  { id: 'm-rag', title: 'RAG', order: 16, track_id: 't-inter', lessons: [{ id: 'l3' }] },
  { id: 'm-novo', title: 'Curso recém-criado', order: 30, track_id: null, lessons: [] },
];

const TRACKS = [
  { id: 't-basico', title: 'Trilha Básica', level: 'basico', order: 0 },
  { id: 't-inter', title: 'Trilha Intermediária', level: 'intermediario', order: 1 },
];

function renderPage() {
  return render(<MemoryRouter><CursosPage /></MemoryRouter>);
}

describe('CursosPage', () => {
  beforeEach(() => {
    mocks.from.mockImplementation(createQuery);
    mocks.responses = {};
  });

  it('agrupa os cursos por trilha, com nível e totais', async () => {
    mocks.responses = { modules: { data: MODULES, error: null }, tracks: { data: TRACKS, error: null } };
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Trilhas' })).toBeInTheDocument();

    const basica = screen.getByRole('region', { name: 'Trilha Básica' });
    expect(within(basica).getByText('Básico')).toBeInTheDocument();
    expect(within(basica).getByText('Engenharia de Prompt')).toBeInTheDocument();
    expect(within(basica).getByText('1 curso · 0/2 aulas')).toBeInTheDocument();
    expect(within(basica).queryByText('RAG')).not.toBeInTheDocument();

    const inter = screen.getByRole('region', { name: 'Trilha Intermediária' });
    expect(within(inter).getByText('RAG')).toBeInTheDocument();

    const outros = screen.getByRole('region', { name: 'Outros cursos' });
    expect(within(outros).getByText('Curso recém-criado')).toBeInTheDocument();
  });

  it('cai na lista simples quando a tabela de trilhas não está disponível', async () => {
    mocks.responses = {
      modules: { data: MODULES, error: null },
      tracks: { data: null, error: { message: 'relation "tracks" does not exist' } },
    };
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Cursos' })).toBeInTheDocument();
    expect(screen.getByText('Engenharia de Prompt')).toBeInTheDocument();
    expect(screen.getByText('RAG')).toBeInTheDocument();
    expect(screen.getByText('Curso recém-criado')).toBeInTheDocument();
    expect(screen.queryByText('Outros cursos')).not.toBeInTheDocument();
  });

  it('mostra erro quando os cursos não carregam', async () => {
    mocks.responses = { modules: { data: null, error: { message: 'falhou' } }, tracks: { data: TRACKS, error: null } };
    renderPage();
    expect(await screen.findByText('Erro ao carregar cursos.')).toBeInTheDocument();
  });
});
