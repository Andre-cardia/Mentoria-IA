import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ENSINO_BASE, FIRST_ACCESS_PATH, GESTAO_BASE } from '../../lib/app-env';
import { FIRST_ACCESS_PASSWORD_REQUIREMENTS } from '../../../shared/first-access.js';
import { AuthContext } from '../context/useAuth';
import FirstAccessPasswordPage from '../pages/FirstAccessPasswordPage';
import LoginPage from '../pages/LoginPage';

const services = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  signIn: vi.fn(),
  request: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: { getSession: services.getSession, signOut: services.signOut } },
}));

const student = {
  id: 'student-id', email: 'aluna@example.test', app_metadata: { password_change_required: true },
};
const admin = {
  id: 'admin-id', email: 'admin@example.test', app_metadata: { role: 'admin', password_change_required: true },
};
const CURRENT_PASSWORD = 'SenhaAtual!1';
const NEW_PASSWORD = 'MinhaNova!2';

function CurrentPath({ base }) {
  const location = useLocation();
  return <output aria-label="Endereço atual">{base}{location.pathname}</output>;
}

/** @param {{ area?: 'ensino' | 'gestao', user?: typeof student | typeof admin | null }} options */
function renderPage({ area = 'ensino', user = student } = {}) {
  const base = area === 'gestao' ? GESTAO_BASE : ENSINO_BASE;
  return render(
    <MemoryRouter basename={base} initialEntries={[`${base}${FIRST_ACCESS_PATH}`]}>
      <AuthContext.Provider value={{ user, loading: false, signIn: services.signIn }}>
        <Routes>
          <Route path={FIRST_ACCESS_PATH} element={<FirstAccessPasswordPage area={area} />} />
          <Route path="/login" element={<LoginPage area={area} />} />
          <Route path="/inicio" element={<h1>Área do aluno</h1>} />
          <Route path="/admin/alunos" element={<h1>Painel administrativo</h1>} />
          <Route path="/crm/leads" element={<h1>CRM</h1>} />
        </Routes>
        <CurrentPath base={base} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

async function submit(password = NEW_PASSWORD, confirmation = password) {
  const browserUser = userEvent.setup();
  await browserUser.type(screen.getByLabelText('Senha atual'), CURRENT_PASSWORD);
  await browserUser.type(screen.getByLabelText('Nova senha'), password);
  await browserUser.type(screen.getByLabelText('Confirmar nova senha'), confirmation);
  await browserUser.click(screen.getByRole('button', { name: 'Alterar senha' }));
}

describe('FirstAccessPasswordPage', () => {
  beforeEach(() => {
    services.getSession.mockReset().mockResolvedValue({ data: { session: { access_token: 'current-token' } } });
    services.signOut.mockReset().mockResolvedValue({ error: null });
    services.signIn.mockReset();
    services.request.mockReset();
    vi.stubGlobal('fetch', services.request);
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each(/** @type {const} */ ([
    { area: 'ensino', base: ENSINO_BASE, user: student, destination: 'Área do aluno' },
    { area: 'gestao', base: GESTAO_BASE, user: admin, destination: 'Painel administrativo' },
  ]))('salva a senha e exige novo login em $area', async ({ area, base, user, destination }) => {
    services.request.mockResolvedValue(Response.json({ ok: true }));
    services.signIn.mockResolvedValue({
      data: { user: { ...user, app_metadata: { ...user.app_metadata, password_change_required: false } } },
      error: null,
    });
    renderPage({ area, user });

    expect(screen.getByLabelText('Nova senha')).toHaveAccessibleDescription(FIRST_ACCESS_PASSWORD_REQUIREMENTS);
    expect(screen.getByLabelText('Senha atual')).toHaveAttribute('autocomplete', 'current-password');
    await submit();

    expect(services.request).toHaveBeenCalledExactlyOnceWith('/api/auth/first-password', {
      method: 'POST',
      headers: { Authorization: 'Bearer current-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: CURRENT_PASSWORD, password: NEW_PASSWORD }),
    });
    expect(services.signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
    expect(await screen.findByText('Senha alterada. Entre novamente com a nova senha.')).toBeInTheDocument();
    expect(screen.getByLabelText('Endereço atual')).toHaveTextContent(`${base}/login`);
    expect(services.signIn).not.toHaveBeenCalled();

    const browserUser = userEvent.setup();
    await browserUser.type(screen.getByPlaceholderText('seu@email.com'), user.email);
    await browserUser.type(screen.getByPlaceholderText('••••••••'), NEW_PASSWORD);
    await browserUser.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: destination })).toBeInTheDocument();
    expect(services.signIn).toHaveBeenCalledExactlyOnceWith(user.email, NEW_PASSWORD);
  });

  it.each([
    ['curta', 'curta', FIRST_ACCESS_PASSWORD_REQUIREMENTS],
    [NEW_PASSWORD, 'OutraSenha!3', 'As senhas não coincidem.'],
    [CURRENT_PASSWORD, CURRENT_PASSWORD, 'A nova senha deve ser diferente da senha atual.'],
  ])('recusa nova senha ou confirmação inválida sem chamar a API', async (password, confirmation, message) => {
    renderPage();
    await submit(password, confirmation);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(services.request).not.toHaveBeenCalled();
  });

  it('exibe a recusa quando a senha atual está incorreta', async () => {
    services.request.mockResolvedValue(Response.json({ error: 'Senha atual incorreta.' }, { status: 400 }));
    renderPage();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Senha atual incorreta.');
    expect(services.signOut).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Alterar senha' })).toBeEnabled();
  });

  it('manda ao login da mesma área se a API recusar a sessão', async () => {
    services.request.mockResolvedValue(new Response(null, { status: 401 }));
    renderPage({ area: 'gestao', user: admin });
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Sua sessão expirou. Entre novamente para alterar a senha.');
    expect(screen.getByLabelText('Endereço atual')).toHaveTextContent('/gestao/login');
    expect(services.signOut).not.toHaveBeenCalled();
  });

  it('leva ao login se a API confirmar que a troca já foi concluída', async () => {
    services.request.mockResolvedValue(Response.json({ error: 'A troca de senha do primeiro acesso já foi concluída.' }, { status: 409 }));
    renderPage();
    await submit();

    expect(await screen.findByText('Senha alterada. Entre novamente com a nova senha.')).toBeInTheDocument();
    expect(services.signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
  });

  it('permite repetir apenas a saída local se ela falhar depois de salvar a senha', async () => {
    services.request.mockResolvedValue(Response.json({ ok: true }));
    services.signOut.mockResolvedValueOnce({ error: new Error('Rede indisponível') });
    renderPage();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível encerrar esta sessão.');
    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar encerrar sessão novamente' }));

    expect(await screen.findByText('Senha alterada. Entre novamente com a nova senha.')).toBeInTheDocument();
    expect(services.request).toHaveBeenCalledOnce();
    expect(services.signOut.mock.calls).toEqual([[{ scope: 'local' }], [{ scope: 'local' }]]);
  });

  it('redireciona uma sessão sem a marca de troca obrigatória para a área normal', async () => {
    renderPage({ user: { ...student, app_metadata: { password_change_required: false } } });
    expect(await screen.findByRole('heading', { name: 'Área do aluno' })).toBeInTheDocument();
    expect(services.request).not.toHaveBeenCalled();
  });

  it('redireciona o acesso direto sem sessão para o login', async () => {
    renderPage({ user: null });
    expect(await screen.findByRole('heading', { name: 'Entre na sua conta' })).toBeInTheDocument();
    expect(services.request).not.toHaveBeenCalled();
  });
});
