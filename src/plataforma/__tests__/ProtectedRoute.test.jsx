import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const authState = {
  user: null,
  loading: false,
  isAdmin: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';

function buildAuthContext(overrides = {}) {
  return {
    user: null,
    loading: false,
    isAdmin: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

function renderWithAuth(ui, authValue, initialPath = '/') {
  Object.assign(authState, buildAuthContext(authValue));

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      {ui}
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redireciona para /login quando usuário não está autenticado', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<ProtectedRoute><div>Conteúdo Protegido</div></ProtectedRoute>} />
        <Route path="/login" element={<div>Página de Login</div>} />
      </Routes>,
      { user: null }
    );
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo Protegido')).not.toBeInTheDocument();
  });

  it('renderiza children quando usuário está autenticado', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<ProtectedRoute><div>Conteúdo Protegido</div></ProtectedRoute>} />
        <Route path="/login" element={<div>Página de Login</div>} />
      </Routes>,
      { user: { email: 'aluno@test.com', user_metadata: {} } }
    );
    expect(screen.getByText('Conteúdo Protegido')).toBeInTheDocument();
  });

  it('exibe spinner de carregamento enquanto loading=true', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<ProtectedRoute><div>Conteúdo</div></ProtectedRoute>} />
      </Routes>,
      { loading: true }
    );
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('redireciona para /login quando não autenticado', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<AdminRoute><div>Painel Admin</div></AdminRoute>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>,
      { user: null, isAdmin: false }
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Painel Admin')).not.toBeInTheDocument();
  });

  it('redireciona para /modulos quando autenticado mas sem role admin', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<AdminRoute><div>Painel Admin</div></AdminRoute>} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/modulos" element={<div>Área do Aluno</div>} />
      </Routes>,
      { user: { email: 'aluno@test.com' }, isAdmin: false }
    );
    expect(screen.getByText('Área do Aluno')).toBeInTheDocument();
    expect(screen.queryByText('Painel Admin')).not.toBeInTheDocument();
  });

  it('renderiza children quando usuário tem role admin', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<AdminRoute><div>Painel Admin</div></AdminRoute>} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/modulos" element={<div>Área do Aluno</div>} />
      </Routes>,
      { user: { email: 'admin@test.com' }, isAdmin: true }
    );
    expect(screen.getByText('Painel Admin')).toBeInTheDocument();
  });

  it('exibe spinner de verificação enquanto loading=true', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<AdminRoute><div>Admin</div></AdminRoute>} />
      </Routes>,
      { loading: true }
    );
    expect(screen.getByText('Verificando permissões...')).toBeInTheDocument();
  });
});
