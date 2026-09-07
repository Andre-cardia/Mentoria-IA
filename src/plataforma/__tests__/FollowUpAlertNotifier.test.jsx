import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const { mockPendingAlerts, mockUpdateFollowUp } = vi.hoisted(() => ({
  mockPendingAlerts: [
    {
      id: 'fu-due-1',
      lead_id: 'lead-alert-1',
      scheduled_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago (overdue)
      title: 'Ligar para alinhar escopo da proposta técnica',
      notes: 'Verificar urgência e decisores',
      completed: false,
      proposal_requests: {
        id: 'lead-alert-1',
        name: 'Roberto Valente',
        company: 'Tech Logística',
        whatsapp: '11999991111',
        email: 'roberto@techlog.com',
        status: 'proposal',
      },
    },
  ],
  mockUpdateFollowUp: vi.fn(),
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
      if (table === 'lead_follow_ups') {
        return createBuilder(() => mockPendingAlerts, null, mockUpdateFollowUp);
      }
      return createBuilder(() => []);
    }),
  },
}));

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@neuralhub.ia.br' },
    isAdmin: true,
    hasCrmAccess: true,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import FollowUpAlertNotifier from '../components/crm/FollowUpAlertNotifier';

describe('FollowUpAlertNotifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pop-up alert modal when a follow-up is due', async () => {
    render(
      <MemoryRouter>
        <FollowUpAlertNotifier />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Lembrete Atrasado')).toBeInTheDocument();
      expect(screen.getByText(/Roberto Valente/i)).toBeInTheDocument();
      expect(screen.getByText(/Ligar para alinhar escopo da proposta técnica/i)).toBeInTheDocument();
    });

    // Check action buttons
    expect(screen.getByRole('button', { name: /Marcar Feito/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adiar 15 min/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Visualizar Panorama do Cliente/i })).toBeInTheDocument();
  });

  it('completes follow-up when clicking "Marcar Feito"', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FollowUpAlertNotifier />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Marcar Feito/i })).toBeInTheDocument();
    });

    const completeBtn = screen.getByRole('button', { name: /Marcar Feito/i });
    await user.click(completeBtn);

    await waitFor(() => {
      expect(mockUpdateFollowUp).toHaveBeenCalledWith(
        expect.objectContaining({ completed: true }),
        { col: 'id', val: 'fu-due-1' }
      );
    });
  });
});
