import { useCallback, useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'neuralhub-theme';
const THEME_EVENT = 'neuralhub-theme-changed';

/** @returns {'light' | 'dark'} */
export function getTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/** Aplica o tema na página e guarda a escolha (vale para ensino e gestão). */
export function setTheme(theme) {
  if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme === 'dark' ? 'dark' : 'light');
  } catch {
    // Sem armazenamento (modo privado restrito): o tema vale só para esta visita.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function useTheme() {
  const [theme, setThemeState] = useState(getTheme);

  useEffect(() => {
    const sync = () => setThemeState(getTheme());
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }, []);

  return { theme, toggleTheme };
}
