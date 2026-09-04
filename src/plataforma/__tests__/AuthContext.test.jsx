import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/useAuth';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

import { supabase } from '../../lib/supabase';

/** @type {{ getSession: import('vitest').Mock, onAuthStateChange: import('vitest').Mock, signInWithPassword: import('vitest').Mock, signOut: import('vitest').Mock }} */
const auth = /** @type {typeof auth} */ (/** @type {unknown} */ (supabase.auth));

function TestConsumer() {
  const { user, loading, role, isAdmin, isCommercial, hasCrmAccess, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
      <span data-testid="role">{role ?? 'none'}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
      <span data-testid="isCommercial">{String(isCommercial)}</span>
      <span data-testid="hasCrmAccess">{String(hasCrmAccess)}</span>
      <button onClick={() => signIn('test@test.com', '123456')}>Login</button>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('inicia com loading=true e user=null enquanto sessão é verificada', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    renderWithAuth();
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
  });

  it('carrega usuário quando sessão existe', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'aluno@test.com', user_metadata: { role: 'aluno' } } } },
    });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('aluno@test.com'));
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
    expect(screen.getByTestId('hasCrmAccess').textContent).toBe('false');
  });

  it('isAdmin=true quando role=admin no user_metadata', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'admin@test.com', user_metadata: { role: 'admin' } } } },
    });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('isAdmin').textContent).toBe('true'));
    expect(screen.getByTestId('role').textContent).toBe('admin');
    expect(screen.getByTestId('hasCrmAccess').textContent).toBe('true');
  });

  it('isCommercial=true e hasCrmAccess=true quando role=comercial', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'comercial@test.com', user_metadata: { role: 'comercial' } } } },
    });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('isCommercial').textContent).toBe('true'));
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
    expect(screen.getByTestId('role').textContent).toBe('comercial');
    expect(screen.getByTestId('hasCrmAccess').textContent).toBe('true');
  });

  it('signIn chama supabase.auth.signInWithPassword com credenciais corretas', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signInWithPassword.mockResolvedValue({ error: null });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await userEvent.click(screen.getByText('Login'));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: '123456',
    });
  });

  it('signOut chama supabase.auth.signOut', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.signOut.mockResolvedValue({});
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await userEvent.click(screen.getByText('Logout'));
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
});
