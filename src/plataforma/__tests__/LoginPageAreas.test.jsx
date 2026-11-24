import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { ENSINO_BASE, FIRST_ACCESS_PATH, GESTAO_BASE, isGestaoPath, isStaffRole } from '../../lib/app-env';

const auth = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn() }));

vi.mock('../context/useAuth', () => ({ useAuth: () => auth }));
vi.mock('../../lib/supabase', () => ({ isSupabaseConfigured: true }));

function signInAs(role, firstAccess = false) {
  auth.signIn.mockResolvedValue({
    data: { user: {
      id: 'u1',
      app_metadata: { role, ...(firstAccess ? { password_change_required: true } : {}) },
      user_metadata: { role: 'admin', password_change_required: true },
    } },
    error: null,
  });
}

async function login(area) {
  const base = area === 'gestao' ? GESTAO_BASE : ENSINO_BASE;
  render(
    <MemoryRouter basename={base} initialEntries={[`${base}/login`]}>
      <Routes>
        <Route path="/login" element={<LoginPage area={area} />} />
        <Route path={FIRST_ACCESS_PATH} element={<div>Troca no primeiro acesso</div>} />
        <Route path="/inicio" element={<div>Área do aluno</div>} />
        <Route path="/admin/alunos" element={<div>Painel admin</div>} />
        <Route path="/crm/leads" element={<div>CRM</div>} />
      </Routes>
    </MemoryRouter>
  );
  await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'pessoa@test.com');
  await userEvent.type(screen.getByPlaceholderText('••••••••'), 'segredo123');
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginPage — ambiente de gestão', () => {
  beforeEach(() => {
    auth.signIn.mockReset();
    auth.signOut.mockReset().mockResolvedValue({});
  });

  it('recusa aluno e encerra a sessão, mesmo com role forjado em user_metadata', async () => {
    signInAs(null);
    await login('gestao');

    expect(await screen.findByText(/restrita à equipe/)).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Painel admin')).not.toBeInTheDocument();
  });

  it('leva o admin ao painel administrativo', async () => {
    signInAs('admin');
    await login('gestao');
    expect(await screen.findByText('Painel admin')).toBeInTheDocument();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('leva o comercial ao CRM', async () => {
    signInAs('comercial');
    await login('gestao');
    expect(await screen.findByText('CRM')).toBeInTheDocument();
  });

  it.each(['admin', 'comercial'])('leva %s com troca obrigatória ao primeiro acesso da Gestão', async (role) => {
    signInAs(role, true);
    await login('gestao');
    expect(await screen.findByText('Troca no primeiro acesso')).toBeInTheDocument();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('continua recusando a conta de aluno no login da Gestão quando há troca obrigatória', async () => {
    signInAs('aluno', true);
    await login('gestao');
    expect(await screen.findByRole('alert')).toHaveTextContent('Esta área é restrita à equipe.');
    expect(screen.queryByText('Troca no primeiro acesso')).not.toBeInTheDocument();
  });

  it('não oferece criação de conta', () => {
    render(<MemoryRouter><LoginPage area="gestao" /></MemoryRouter>);
    expect(screen.queryByText('Criar conta')).not.toBeInTheDocument();
  });
});

describe('LoginPage — ambiente de ensino', () => {
  beforeEach(() => {
    auth.signIn.mockReset();
    auth.signOut.mockReset().mockResolvedValue({});
  });

  it('leva o aluno ao início', async () => {
    signInAs(null);
    await login('ensino');
    expect(await screen.findByText('Área do aluno')).toBeInTheDocument();
  });

  it('recusa conta comercial e aponta para a gestão', async () => {
    signInAs('comercial', true);
    await login('ensino');
    expect(await screen.findByText(/equipe comercial/)).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Área do aluno')).not.toBeInTheDocument();
  });

  it('leva uma conta nova de aluno ao primeiro acesso do Ensino', async () => {
    signInAs(null, true);
    await login('ensino');
    expect(await screen.findByText('Troca no primeiro acesso')).toBeInTheDocument();
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe('app-env', () => {
  it('reconhece só caminhos do ambiente de gestão', () => {
    expect(isGestaoPath('/gestao')).toBe(true);
    expect(isGestaoPath('/gestao/crm/leads')).toBe(true);
    expect(isGestaoPath('/gestaoextra')).toBe(false);
    expect(isGestaoPath('/plataforma/inicio')).toBe(false);
  });

  it('trata apenas admin e comercial como equipe', () => {
    expect(isStaffRole('admin')).toBe(true);
    expect(isStaffRole('comercial')).toBe(true);
    expect(isStaffRole('aluno')).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });
});
