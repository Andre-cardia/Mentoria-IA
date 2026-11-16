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

vi.mock('../context/useAuth', () => ({
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

  it('inicia recolhida em viewport móvel, só com os ícones do menu', () => {
    render(
      <MemoryRouter>
        <Layout><div>Conteúdo do dashboard</div></Layout>
      </MemoryRouter>,
    );

    expect(screen.getByTitle('Expandir menu')).toBeInTheDocument();
    // Recolhido, o item continua acessível pelo ícone, sem o rótulo visível.
    expect(screen.getByRole('link', { name: 'Início' })).toBeInTheDocument();
    expect(screen.queryByText('Início')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('mentoria-platform-main');
  });
});
