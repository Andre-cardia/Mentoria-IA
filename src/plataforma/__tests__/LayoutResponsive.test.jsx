import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
    }),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'student-1', email: 'aluno@example.com' },
    isAdmin: false,
    profile: { full_name: 'Aluno Teste', avatar_url: null },
    signOut: vi.fn(),
  }),
}));

vi.mock('../hooks/useLessonProgress', () => ({
  useLessonProgress: () => ({
    getTotalProgress: () => ({ completed: 0, total: 0 }),
  }),
}));

import Layout from '../components/Layout';

describe('Layout responsivo da plataforma', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('inicia com a sidebar recolhida em viewport móvel', () => {
    render(
      <MemoryRouter>
        <Layout><div>Conteúdo do dashboard</div></Layout>
      </MemoryRouter>,
    );

    expect(screen.getByTitle('Expandir menu')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Início' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('mentoria-platform-main');
  });
});
