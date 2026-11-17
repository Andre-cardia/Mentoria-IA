import { useTheme } from '../../lib/theme';
import NavIcon from './NavIcon';

// Alterna entre o tema claro (padrão) e o escuro. A escolha fica salva no navegador.
export default function ThemeToggle({ collapsed = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Usar tema claro' : 'Usar tema escuro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={collapsed ? label : undefined}
      aria-label={label}
      aria-pressed={isDark}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '10px',
        width: collapsed ? '40px' : '100%', height: collapsed ? '40px' : 'auto',
        padding: collapsed ? 0 : '8px 12px',
        background: 'transparent', border: '1px solid var(--line)',
        borderRadius: '8px', color: 'var(--text)',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <NavIcon name={isDark ? 'sol' : 'lua'} size={18} />
      {!collapsed && (isDark ? 'Tema claro' : 'Tema escuro')}
    </button>
  );
}
