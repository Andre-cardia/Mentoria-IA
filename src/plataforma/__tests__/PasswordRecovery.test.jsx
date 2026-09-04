import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/useAuth';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

import { supabase } from '../../lib/supabase';

/** @type {{ getSession: import('vitest').Mock, onAuthStateChange: import('vitest').Mock, resetPasswordForEmail: import('vitest').Mock, updateUser: import('vitest').Mock }} */
const auth = /** @type {typeof auth} */ (/** @type {unknown} */ (supabase.auth));
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

// Helpers
function mockAuthContext(overrides = {}) {
  return {
    user: null,
    loading: false,
    role: null,
    isAdmin: false,
    isCommercial: false,
    hasCrmAccess: false,
    profile: null,
    profileError: null,
    refreshProfile: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    ...overrides,
  };
}

function renderWithContext(ui, ctx = {}) {
  return render(
    <AuthContext.Provider value={mockAuthContext(ctx)}>
      <MemoryRouter initialEntries={['/esqueci-senha']}>
        {ui}
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// PasswordStrengthIndicator
// ─────────────────────────────────────────────
describe('PasswordStrengthIndicator', () => {
  it('não renderiza nada para senha vazia', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('exibe "fraca" para senha curta sem complexidade', () => {
    render(<PasswordStrengthIndicator password="abc" />);
    expect(screen.getByText(/senha fraca/i)).toBeTruthy();
  });

  it('exibe "média" para senha com comprimento, maiúscula e número', () => {
    render(<PasswordStrengthIndicator password="Abcdefg1" />);
    expect(screen.getByText(/senha média/i)).toBeTruthy();
  });

  it('exibe "forte" para senha complexa', () => {
    render(<PasswordStrengthIndicator password="Abcdefg1!" />);
    expect(screen.getByText(/senha forte/i)).toBeTruthy();
  });
});

// ─────────────────────────────────────────────
// ForgotPasswordPage
// ─────────────────────────────────────────────
describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza input de e-mail e botão de envio', () => {
    renderWithContext(<ForgotPasswordPage />);
    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy();
    expect(screen.getByRole('button', { name: /enviar link/i })).toBeTruthy();
  });

  it('botão fica desabilitado durante loading (AC-4)', async () => {
    const resetPassword = vi.fn(() => new Promise(() => {})); // nunca resolve
    renderWithContext(<ForgotPasswordPage />, { resetPassword });

    const input = screen.getByPlaceholderText('seu@email.com');
    const button = screen.getByRole('button', { name: /enviar link/i });

    await userEvent.type(input, 'test@test.com');
    await userEvent.click(button);

    expect(/** @type {HTMLButtonElement} */ (button).disabled).toBe(true);
  });

  it('exibe mensagem ambígua após envio bem-sucedido (AC-3)', async () => {
    const resetPassword = vi.fn().mockResolvedValue({ error: null });
    renderWithContext(<ForgotPasswordPage />, { resetPassword });

    const input = screen.getByPlaceholderText('seu@email.com');
    await userEvent.type(input, 'qualquer@email.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/se este e-mail estiver cadastrado/i)).toBeTruthy();
    });
    expect(resetPassword).toHaveBeenCalledWith('qualquer@email.com');
  });

  it('não revela se e-mail existe na mensagem de confirmação (AC-3)', async () => {
    const resetPassword = vi.fn().mockResolvedValue({ error: null });
    renderWithContext(<ForgotPasswordPage />, { resetPassword });

    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'nao-existe@email.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      const msg = screen.getByText(/se este e-mail estiver cadastrado/i);
      expect(msg).toBeTruthy();
      expect(msg.textContent).not.toMatch(/não encontrado|inválido|não cadastrado/i);
    });
  });

  it('exibe erro genérico quando resetPassword falha', async () => {
    const resetPassword = vi.fn().mockResolvedValue({ error: new Error('fail') });
    renderWithContext(<ForgotPasswordPage />, { resetPassword });

    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'test@test.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível enviar o link/i)).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────
// ResetPasswordPage
// ─────────────────────────────────────────────
describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supabase PKCE: simula ?code= na URL para não redirecionar
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?code=fake-code', hash: '' },
    });
  });

  function renderReset(ctx = {}) {
    return render(
      <AuthContext.Provider value={mockAuthContext(ctx)}>
        <MemoryRouter initialEntries={['/redefinir-senha#access_token=fake']}>
          <Routes>
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            <Route path="/esqueci-senha" element={<div>esqueci-senha</div>} />
            <Route path="/login" element={<div>login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  }

  it('exibe estado de validação enquanto aguarda evento PASSWORD_RECOVERY', () => {
    auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    renderReset();
    expect(screen.getByText(/validando link/i)).toBeTruthy();
  });

  it('exibe formulário após evento PASSWORD_RECOVERY', async () => {
    let authCallback;
    auth.onAuthStateChange.mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    renderReset();

    act(() => { authCallback('PASSWORD_RECOVERY', null); });

    await waitFor(() => {
      expect(screen.getByText(/redefina sua senha/i)).toBeTruthy();
    });
  });

  it('exibe erro inline quando senhas não coincidem (AC-6)', async () => {
    let authCallback;
    auth.onAuthStateChange.mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    renderReset();
    act(() => { authCallback('PASSWORD_RECOVERY', null); });

    await waitFor(() => screen.getByText(/redefina sua senha/i));

    const [passInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(passInput, 'senha123');
    await userEvent.type(confirmInput, 'senha456');

    expect(screen.getByText(/as senhas não coincidem/i)).toBeTruthy();
  });

  it('chama updatePassword e redireciona para /login após sucesso (AC-8)', async () => {
    const updatePassword = vi.fn().mockResolvedValue({ error: null });
    let authCallback;
    auth.onAuthStateChange.mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    renderReset({ updatePassword });
    act(() => { authCallback('PASSWORD_RECOVERY', null); });

    await waitFor(() => screen.getByText(/redefina sua senha/i));

    const [passInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(passInput, 'novaSenha123!');
    await userEvent.type(confirmInput, 'novaSenha123!');
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith('novaSenha123!');
      expect(screen.getByText('login')).toBeTruthy();
    });
  });

  it('exibe erro quando updatePassword falha', async () => {
    const updatePassword = vi.fn().mockResolvedValue({ error: new Error('fail') });
    let authCallback;
    auth.onAuthStateChange.mockImplementation((cb) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    renderReset({ updatePassword });
    act(() => { authCallback('PASSWORD_RECOVERY', null); });

    await waitFor(() => screen.getByText(/redefina sua senha/i));

    const [passInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(passInput, 'novaSenha123!');
    await userEvent.type(confirmInput, 'novaSenha123!');
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText(/não foi possível redefinir a senha/i)).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────
// AuthContext — resetPassword e updatePassword
// ─────────────────────────────────────────────
describe('AuthContext — resetPassword e updatePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('resetPassword chama supabase.auth.resetPasswordForEmail com redirectTo', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });

    const { AuthProvider } = await import('../context/AuthContext');
    const { useAuth } = await import('../context/useAuth');

    function Consumer() {
      const { resetPassword } = useAuth();
      return <button onClick={() => resetPassword('user@test.com')}>reset</button>;
    }

    render(
      <AuthProvider>
        <MemoryRouter><Consumer /></MemoryRouter>
      </AuthProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'reset' }));

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'user@test.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/plataforma/redefinir-senha') })
    );
  });

  it('updatePassword chama supabase.auth.updateUser com nova senha', async () => {
    auth.updateUser.mockResolvedValue({ error: null });

    const { AuthProvider } = await import('../context/AuthContext');
    const { useAuth } = await import('../context/useAuth');

    function Consumer() {
      const { updatePassword } = useAuth();
      return <button onClick={() => updatePassword('newPass123!')}>update</button>;
    }

    render(
      <AuthProvider>
        <MemoryRouter><Consumer /></MemoryRouter>
      </AuthProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'update' }));

    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'newPass123!' });
  });
});
