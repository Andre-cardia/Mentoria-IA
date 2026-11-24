import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { FIRST_ACCESS_PATH } from '../../lib/app-env';

const authState = {
  user: null,
  loading: false,
  isAdmin: false,
  isCommercial: false,
  hasCrmAccess: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('../context/useAuth', () => ({
  useAuth: () => authState,
}));

import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import CrmRoute from '../components/CrmRoute';

function buildAuthContext(overrides = {}) {
  return {
    user: null,
    loading: false,
    isAdmin: false,
    isCommercial: false,
    hasCrmAccess: false,
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

it.each([
  { Guard: ProtectedRoute, role: 'aluno' },
  { Guard: AdminRoute, role: 'admin' },
  { Guard: CrmRoute, role: 'comercial' },
])('exige a troca antes de abrir diretamente a rota protegida de $role', ({ Guard, role }) => {
  renderWithAuth(
    <Routes>
      <Route path="/" element={<Guard><div>Conteúdo protegido</div></Guard>} />
      <Route path={FIRST_ACCESS_PATH} element={<div>Primeiro acesso</div>} />
    </Routes>,
    {
      user: { app_metadata: { role, password_change_required: true } },
      isAdmin: role === 'admin',
      hasCrmAccess: role !== 'aluno',
    },
  );

  expect(screen.getByText('Primeiro acesso')).toBeInTheDocument();
  expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
});

describe('CrmRoute', () => {
  it('redireciona para /login quando não autenticado', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<CrmRoute><div>CRM</div></CrmRoute>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>,
      { user: null, hasCrmAccess: false }
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('CRM')).not.toBeInTheDocument();
  });

  it('manda para o login quem está autenticado sem acesso CRM', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<CrmRoute><div>CRM</div></CrmRoute>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>,
      { user: { email: 'aluno@test.com' }, hasCrmAccess: false }
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('CRM')).not.toBeInTheDocument();
  });

  it('renderiza children quando usuário tem role comercial', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<CrmRoute><div>CRM</div></CrmRoute>} />
      </Routes>,
      { user: { email: 'comercial@test.com' }, isCommercial: true, hasCrmAccess: true }
    );
    expect(screen.getByText('CRM')).toBeInTheDocument();
  });

  it('renderiza children quando usuário tem role admin', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<CrmRoute><div>CRM</div></CrmRoute>} />
      </Routes>,
      { user: { email: 'admin@test.com' }, isAdmin: true, hasCrmAccess: true }
    );
    expect(screen.getByText('CRM')).toBeInTheDocument();
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

  it('manda para o login quem está autenticado mas não é da equipe', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<AdminRoute><div>Painel Admin</div></AdminRoute>} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/crm/leads" element={<div>CRM</div>} />
      </Routes>,
      { user: { email: 'aluno@test.com' }, isAdmin: false, hasCrmAccess: false }
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Painel Admin')).not.toBeInTheDocument();
  });

  it('manda o comercial para o CRM em vez do painel admin', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<AdminRoute><div>Painel Admin</div></AdminRoute>} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/crm/leads" element={<div>CRM</div>} />
      </Routes>,
      { user: { email: 'comercial@test.com' }, isAdmin: false, isCommercial: true, hasCrmAccess: true }
    );
    expect(screen.getByText('CRM')).toBeInTheDocument();
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
