import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const { mockLeads, mockRpc, mockInsert } = vi.hoisted(() => ({
  mockLeads: [
    {
      id: 'lead-1',
      name: 'Lead Existente',
      email: 'existente@example.com',
      whatsapp: '11988887777',
      company: 'Empresa Alpha',
      role: 'Diretor',
      company_size: '11-50 pessoas',
      objective: 'Consultoria IA',
      urgency: 'Quero planejar este trimestre',
      status: 'new',
      created_at: new Date().toISOString(),
      source: 'neural-hub-proposta',
    },
  ],
  mockRpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  mockInsert: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'proposal_requests') {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: mockLeads, error: null }),
          })),
          insert: mockInsert,
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    }),
    rpc: mockRpc,
  },
}));

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-user-1', email: 'admin@neuralhub.ia.br', user_metadata: { role: 'admin' } },
    isAdmin: true,
    isCommercial: false,
    hasCrmAccess: true,
    signOut: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

import AdminLeadsPage from '../pages/admin/AdminLeadsPage';

describe('AdminLeadsPage - Modal Novo Lead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abre o modal de novo lead e permite digitar sem perder o foco', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Existente')).toBeInTheDocument();
    });

    const novoLeadBtn = screen.getByRole('button', { name: 'Novo lead' });
    await user.click(novoLeadBtn);

    expect(screen.getByRole('heading', { name: /Novo lead/i })).toBeInTheDocument();

    const nomeInput = screen.getByRole('textbox', { name: /Nome/i });
    await user.type(nomeInput, 'Carlos Silva');
    expect(nomeInput).toHaveValue('Carlos Silva');
    expect(nomeInput).toHaveFocus();

    const emailInput = screen.getByRole('textbox', { name: /E-mail/i });
    await user.type(emailInput, 'carlos@empresa.com');
    expect(emailInput).toHaveValue('carlos@empresa.com');
    expect(emailInput).toHaveFocus();

    const whatsappInput = screen.getByRole('textbox', { name: /WhatsApp/i });
    await user.type(whatsappInput, '11999998888');
    expect(whatsappInput).toHaveValue('11999998888');
    expect(whatsappInput).toHaveFocus();

    const empresaInput = screen.getByRole('textbox', { name: /Empresa/i });
    await user.type(empresaInput, 'Empresa Beta');
    expect(empresaInput).toHaveValue('Empresa Beta');
    expect(empresaInput).toHaveFocus();

    const cargoInput = screen.getByRole('textbox', { name: /Cargo/i });
    await user.type(cargoInput, 'CTO');
    expect(cargoInput).toHaveValue('CTO');
    expect(cargoInput).toHaveFocus();

    const objetivoInput = screen.getByRole('textbox', { name: /Objetivo principal/i });
    await user.type(objetivoInput, 'Automatizar pipeline de vendas');
    expect(objetivoInput).toHaveValue('Automatizar pipeline de vendas');
    expect(objetivoInput).toHaveFocus();

    const contextoInput = screen.getByRole('textbox', { name: /Contexto/i });
    await user.type(contextoInput, 'Entrou em contato via evento');
    expect(contextoInput).toHaveValue('Entrou em contato via evento');
    expect(contextoInput).toHaveFocus();
  });

  it('fecha o modal com botão Cancelar, Fechar ou tecla Escape', async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <MemoryRouter>
        <AdminLeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Existente')).toBeInTheDocument();
    });

    // Teste 1: Fechar via Cancelar
    await user.click(screen.getByRole('button', { name: 'Novo lead' }));
    expect(screen.getByRole('heading', { name: /Novo lead/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByRole('heading', { name: /Novo lead/i })).not.toBeInTheDocument();

    // Teste 2: Fechar via botão Fechar (topo do modal)
    await user.click(screen.getByRole('button', { name: 'Novo lead' }));
    expect(screen.getByRole('heading', { name: /Novo lead/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Fechar cadastro de lead/i }));
    expect(screen.queryByRole('heading', { name: /Novo lead/i })).not.toBeInTheDocument();

    // Teste 3: Fechar via Escape
    await user.click(screen.getByRole('button', { name: 'Novo lead' }));
    expect(screen.getByRole('heading', { name: /Novo lead/i })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('heading', { name: /Novo lead/i })).not.toBeInTheDocument();

    unmount();
  });

  it('submete com sucesso e insere o lead no kanban', async () => {
    const user = userEvent.setup();
    const createdLead = {
      id: 'lead-new-1',
      name: 'Novo Cliente',
      email: 'novo@cliente.com',
      whatsapp: '11977776666',
      company: 'Startup Nova',
      role: 'Founder',
      company_size: '1-10 pessoas',
      urgency: 'Preciso de proposta com urgência',
      objective: 'MVP com IA',
      context: 'Criado pelo CRM',
      status: 'new',
      created_at: new Date().toISOString(),
      source: 'crm-manual',
    };

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: createdLead, error: null }),
      }),
    });

    render(
      <MemoryRouter>
        <AdminLeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Existente')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Novo lead' }));

    await user.type(screen.getByRole('textbox', { name: /Nome/i }), 'Novo Cliente');
    await user.type(screen.getByRole('textbox', { name: /E-mail/i }), 'novo@cliente.com');
    await user.type(screen.getByRole('textbox', { name: /WhatsApp/i }), '11977776666');
    await user.type(screen.getByRole('textbox', { name: /Empresa/i }), 'Startup Nova');

    await user.click(screen.getByRole('button', { name: /Criar lead/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Novo lead/i })).not.toBeInTheDocument();
      expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
    });
  });
});
