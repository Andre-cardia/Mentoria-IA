import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardStats from '../components/DashboardStats';
import { RANKS } from '../lib/starRace';

describe('DashboardStats', () => {
  it('mostra os badges ao lado do nome na saudação', () => {
    render(<DashboardStats userName="André Cardia" completed={48} total={106} diasEstudando={3} rank={RANKS[2]} />);
    expect(screen.getByRole('heading', { name: 'André Cardia' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Patente Comandante, nave Crew Dragon' })).toBeInTheDocument();
  });

  it('sem patente carregada, mostra só o nome', () => {
    render(<DashboardStats userName="André Cardia" completed={0} total={0} diasEstudando={0} />);
    expect(screen.queryByRole('img', { name: /^Patente / })).not.toBeInTheDocument();
  });
});
