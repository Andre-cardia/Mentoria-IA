import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';

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

function TestConsumer() {
  const { user, loading, isAdmin, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
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
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('inicia com loading=true e user=null enquanto sessão é verificada', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    renderWithAuth();
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
  });

  it('carrega usuário quando sessão existe', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'aluno@test.com', user_metadata: { role: 'aluno' } } } },
    });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('aluno@test.com'));
    expect(screen.getByTestId('isAdmin').textContent).toBe('false');
  });

  it('isAdmin=true quando role=admin no user_metadata', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'admin@test.com', user_metadata: { role: 'admin' } } } },
    });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('isAdmin').textContent).toBe('true'));
  });

  it('signIn chama supabase.auth.signInWithPassword com credenciais corretas', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await userEvent.click(screen.getByText('Login'));
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: '123456',
    });
  });

  it('signOut chama supabase.auth.signOut', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    supabase.auth.signOut.mockResolvedValue({});
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await userEvent.click(screen.getByText('Logout'));
    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });
});
