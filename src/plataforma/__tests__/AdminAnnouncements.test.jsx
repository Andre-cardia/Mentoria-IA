import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

function createAnnouncementsQuery(result) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
}

function announcementResult() {
  return {
    data: [{
      id: 'announcement-1',
      title: 'Aviso em destaque',
      body: 'Conteúdo do aviso',
      type: 'info',
    }],
    error: null,
  };
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mocks.from,
  },
}));

import AdminAnnouncements from '../components/AdminAnnouncements';

describe('AdminAnnouncements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storage.getItem.mockReturnValue(null);
    vi.stubGlobal('localStorage', mocks.storage);
  });

  it('mantém oculto o aviso dispensado quando uma segunda resposta chega atrasada', async () => {
    const user = userEvent.setup();
    let resolveStale;
    const staleResponse = new Promise((resolve) => { resolveStale = resolve; });
    mocks.from
      .mockReturnValueOnce(createAnnouncementsQuery(announcementResult()))
      .mockReturnValueOnce(createAnnouncementsQuery(staleResponse));

    render(
      <StrictMode>
        <AdminAnnouncements />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByText('Aviso em destaque')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Dispensar'));

    expect(screen.queryByText('Aviso em destaque')).not.toBeInTheDocument();
    expect(mocks.storage.setItem).toHaveBeenCalledWith(
      'dismissed_featured_announcements',
      '["announcement-1"]',
    );

    await act(async () => {
      resolveStale(announcementResult());
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText('Aviso em destaque')).not.toBeInTheDocument();
    });
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });
});
