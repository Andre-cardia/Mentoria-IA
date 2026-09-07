import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const { mockLeads, mockFollowUps, mockInsertFollowUp, mockUpdateLead } = vi.hoisted(() => ({
  mockLeads: [
    {
      id: 'lead-1',
      name: 'Carlos Mendes',
      email: 'carlos@empresa.com',
      whatsapp: '11999998888',
      company: 'Empresa Alfa',
      role: 'CEO',
      company_size: '11-50 pessoas',
      objective: 'Consultoria de IA e Automação',
      urgency: 'Imediato',
      status: 'contacted',
      notes: 'Conversou na semana passada.',
      created_at: '2026-04-10T10:00:00Z',
      source: 'neural-hub-proposta',
    },
    {
      id: 'lead-2',
      name: 'Beatriz Silva',
      email: 'beatriz@techcorp.com',
      whatsapp: '21988887777',
      company: 'TechCorp Beta',
      role: 'CTO',
      company_size: '51-200 pessoas',
      objective: 'Treinamento de Equipe',
      urgency: 'Próximo mês',
      status: 'proposal',
      notes: 'Aguardando envio do contrato.',
      created_at: '2026-04-15T14:30:00Z',
      source: 'auditoria-seguranca',
    },
    {
      id: 'lead-3',
      name: 'Daniel Oliveira',
      email: 'daniel@startup.io',
      whatsapp: '31977776666',
      company: 'Startup Gamma',
      role: 'Founder',
      company_size: '1-10 pessoas',
      objective: 'Auditoria de Segurança',
      urgency: 'Imediato',
      status: 'won',
      notes: 'Fechado plano anual.',
      created_at: '2026-04-01T09:00:00Z',
      source: 'auditoria-seguranca',
    },
  ],
  mockFollowUps: [
    {
      id: 'fu-1',
      lead_id: 'lead-2',
      scheduled_at: '2026-04-28T15:00:00Z',
      title: 'Cobrar resposta da proposta comercial',
      notes: 'Ligar após as 14h',
      completed: false,
      completed_at: null,
      created_by_name: 'Equipe Comercial',
    },
  ],
  mockInsertFollowUp: vi.fn(),
  mockUpdateLead: vi.fn(),
}));

function createBuilder(getData, onInsert, onUpdate) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((col, val) => {
      if (onUpdate && query._pendingUpdate) {
        onUpdate(query._pendingUpdate, { col, val });
      }
      return query;
    }),
    lte: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(() => query),
    delete: vi.fn(() => query),
    update: vi.fn((data) => {
      query._pendingUpdate = data;
      return query;
    }),
    insert: vi.fn((data) => {
      if (onInsert) onInsert(data);
      return query;
    }),
    then: (resolve) => resolve({ data: getData(), error: null }),
  };
  return query;
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'proposal_requests') {
        return createBuilder(() => mockLeads, null, mockUpdateLead);
      }
      if (table === 'lead_follow_ups') {
        return createBuilder(() => mockFollowUps, mockInsertFollowUp, null);
      }
      return createBuilder(() => []);
    }),
  },
}));

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@neuralhub.ia.br', user_metadata: { full_name: 'Admin Neural' } },
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
    info: vi.fn(),
  },
  Toaster: () => null,
}));

import CrmClientesPage from '../pages/admin/CrmClientesPage';

describe('CrmClientesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, stats, and client table with mock data', async () => {
    render(
      <MemoryRouter>
        <CrmClientesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gestão de Clientes')).toBeInTheDocument();
    });

    // Check leads loaded in table
    expect(screen.getByText('Carlos Mendes')).toBeInTheDocument();
    expect(screen.getByText('Beatriz Silva')).toBeInTheDocument();
    expect(screen.getByText('Daniel Oliveira')).toBeInTheDocument();

    // Check KPIs
    expect(screen.getByText('Clientes Filtrados')).toBeInTheDocument();
    expect(screen.getByText('Clientes Ganhos')).toBeInTheDocument();
  });

  it('filters clients by search input', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CrmClientesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Carlos Mendes')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nome, e-mail, telefone ou empresa/i);
    await user.type(searchInput, 'Beatriz');

    expect(screen.getByText('Beatriz Silva')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Mendes')).not.toBeInTheDocument();
    expect(screen.queryByText('Daniel Oliveira')).not.toBeInTheDocument();
  });

  it('opens panorama drawer when clicking "Ver Panorama"', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CrmClientesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Beatriz Silva')).toBeInTheDocument();
    });

    // First sorted lead is Beatriz Silva (newest created_at)
    const actionButtons = screen.getAllByRole('button', { name: /Ver Panorama/i });
    await user.click(actionButtons[0]);

    // Drawer should appear with details
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Fechar panorama do cliente/i })).toBeInTheDocument();
      expect(screen.getByText(/Treinamento de Equipe/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Agendar Follow-up/i })).toBeInTheDocument();
    });
  });
});
