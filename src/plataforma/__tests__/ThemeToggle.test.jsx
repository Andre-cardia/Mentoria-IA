import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ThemeToggle from '../components/ThemeToggle';
import { THEME_STORAGE_KEY } from '../../lib/theme';

afterEach(() => {
  delete document.documentElement.dataset.theme;
  window.localStorage.removeItem(THEME_STORAGE_KEY);
});

describe('ThemeToggle', () => {
  it('começa no tema claro e oferece o escuro', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Usar tema escuro' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('alterna para o tema escuro, salva a escolha e volta ao claro', () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'Usar tema escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Usar tema claro' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('respeita o tema já aplicado na página', () => {
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle collapsed />);
    expect(screen.getByRole('button', { name: 'Usar tema claro' })).toHaveAttribute('aria-pressed', 'true');
  });
});
