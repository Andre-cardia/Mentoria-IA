import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { isGestaoPath, isStaffRole } from '../../lib/app-env';

const auth = vi.hoisted(() => ({ signIn: vi.fn(), signOut: vi.fn() }));

vi.mock('../context/useAuth', () => ({ useAuth: () => auth }));
vi.mock('../../lib/supabase', () => ({ isSupabaseConfigured: true }));

function signInAs(role) {
  auth.signIn.mockResolvedValue({
    data: { user: { id: 'u1', app_metadata: role ? { role } : {}, user_metadata: { role: 'admin' } } },
    error: null,
  });
}

async function login(area) {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage area={area} />} />
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
    signInAs('comercial');
    await login('ensino');
    expect(await screen.findByText(/equipe comercial/)).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Área do aluno')).not.toBeInTheDocument();
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
