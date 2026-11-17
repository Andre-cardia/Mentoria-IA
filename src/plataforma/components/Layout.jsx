import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/useAuth';
import { useLessonProgress } from '../hooks/useLessonProgress';
import NavIcon from './NavIcon';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/inicio',       label: 'Início',      icon: 'home' },
  { to: '/cursos',       label: 'Trilhas',     icon: 'trilhas' },
  { to: '/formacoes',    label: 'Formações',   icon: 'formacoes', badge: 'Em breve' },
  { to: '/ranking',      label: 'Corrida Estelar', icon: 'ranking' },
  { to: '/forum',        label: 'Fórum',       icon: 'forum' },
  { to: '/materiais',    label: 'Materiais',   icon: 'materiais' },
  { to: '/avisos',       label: 'Avisos',      icon: 'avisos' },
  { to: '/blog',         label: 'Blog',        icon: 'blog' },
  { to: '/minha-conta',  label: 'Minha Conta', icon: 'conta' },
];

const MOBILE_MEDIA_QUERY = '(max-width: 768px)';
const SIDEBAR_WIDTH = '248px';
const RAIL_WIDTH = '64px';

function isMobileViewport() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

/** @returns {import('react').CSSProperties} */
function linkStyle(isActive, collapsed) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: '12px',
    padding: collapsed ? '10px 0' : '10px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '.95rem',
    fontWeight: isActive ? 700 : 500,
    // Item ativo: laranja cheio com texto escuro (contraste alto sobre o cinza do menu).
    color: isActive ? '#261000' : 'var(--text)',
    background: isActive ? 'var(--accent)' : 'transparent',
    transition: 'color .15s, background .15s',
  };
}

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

/** @type {import('react').CSSProperties} */
const iconButton = {
  flexShrink: 0,
  background: 'transparent', border: '1px solid var(--line)',
  borderRadius: '8px', color: 'var(--text)',
  width: '34px', height: '34px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};

export default function Layout({ children }) {
  const { user, isAdmin, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { getTotalProgress } = useLessonProgress();
  const [modules, setModules] = useState([]);
  const [collapsed, setCollapsed] = useState(isMobileViewport);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('modules')
      .select('id, lessons(id)')
      .then(({ data }) => setModules(data ?? []));
  }, [user]);

  // Conta um acesso por dia (vale pontos no ranking). O banco ignora repetições;
  // a marca local só evita chamadas desnecessárias a cada troca de página.
  useEffect(() => {
    if (!user || typeof supabase.rpc !== 'function') return;
    const key = `neuralhub-acesso-${user.id}`;
    const today = new Date().toDateString();
    try {
      if (window.localStorage.getItem(key) === today) return;
    } catch {
      // Sem armazenamento local: registra a cada carregamento, sem efeito colateral.
    }
    Promise.resolve(supabase.rpc('register_platform_access'))
      .then((res) => {
        if (res?.error) return;
        try { window.localStorage.setItem(key, today); } catch { /* ignora */ }
      })
      .catch(() => { /* registro de acesso nunca deve quebrar a navegação */ });
  }, [user]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const collapseOnMobile = ({ matches }) => {
      if (matches) setCollapsed(true);
    };

    collapseOnMobile(mediaQuery);
    mediaQuery.addEventListener?.('change', collapseOnMobile);
    return () => mediaQuery.removeEventListener?.('change', collapseOnMobile);
  }, []);

  const progress = getTotalProgress(modules);
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <style>{`
        .mentoria-platform-sidebar a:hover { background: var(--hover); }
        .mentoria-platform-sidebar a[aria-current="page"]:hover { background: var(--accent); }
        .mentoria-platform-sidebar button:hover { background: var(--hover); }
        @media (max-width: 768px) {
          .mentoria-platform-sidebar {
            position: fixed !important;
            left: 0;
            z-index: 50;
          }
          .mentoria-platform-main {
            width: 100%;
            box-sizing: border-box;
            padding: 24px 16px 40px 80px !important;
            overflow-x: hidden;
          }
        }
      `}</style>

      <aside className="mentoria-platform-sidebar app-sidebar" style={{
        width: collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '20px 10px' : '20px 14px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width .2s ease, padding .2s ease',
      }}>
        {/* Marca + recolher/expandir */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: '28px', gap: '8px' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '34px', height: '34px', flexShrink: 0,
                background: 'var(--accent)', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1rem', color: '#261000',
              }}>M</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.15, whiteSpace: 'nowrap' }}>Mentoria IA</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Zero-to-Hero</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            style={iconButton}
          >
            <NavIcon name={collapsed ? 'menu' : 'recolher'} size={18} />
          </button>
        </div>

        {/* Navegação — recolhido mostra só os ícones */}
        <nav aria-label="Plataforma" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV_ITEMS.map(({ to, label, icon, badge }) => (
            <NavLink
              key={to} to={to}
              title={collapsed ? label : undefined}
              aria-label={label}
              style={({ isActive }) => linkStyle(isActive, collapsed)}
            >
              <NavIcon name={icon} />
              {!collapsed && <span style={{ flex: 1, minWidth: 0 }}>{label}</span>}
              {!collapsed && badge && (
                <span style={{
                  fontSize: '.7rem', fontWeight: 600, color: 'var(--accent-text)',
                  border: '1px solid var(--line-strong)', borderRadius: '999px',
                  padding: '1px 8px', whiteSpace: 'nowrap',
                }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div style={{ borderTop: '1px solid var(--line)', margin: '14px 0 10px' }} />
              {/* Admin e CRM vivem em outro ambiente, com login próprio. */}
              <a href="/gestao" title={collapsed ? 'Abrir Gestão' : undefined} aria-label="Abrir Gestão" style={linkStyle(false, collapsed)}>
                <NavIcon name="gestao" />
                {!collapsed && <span>Abrir Gestão ↗</span>}
              </a>
            </>
          )}
        </nav>

        {/* Progresso geral */}
        {!collapsed && progress.total > 0 && (
          <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--panel)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '.8rem' }}>
              <span style={{ color: 'var(--muted)' }}>Seu progresso</span>
              <span style={{ fontWeight: 700 }}>{progress.completed}/{progress.total} aulas</span>
            </div>
            <div
              role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso geral"
              style={{ height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}
            >
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: '3px', transition: 'width .3s' }} />
            </div>
          </div>
        )}

        {/* Conta */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: collapsed ? 'center' : 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'var(--panel)', border: '1px solid var(--line-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '.75rem', flexShrink: 0,
              }}>
                {getInitials(profile?.full_name)}
              </div>
            )}
            {!collapsed && (
              <div style={{ fontSize: '.8rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                {user?.email}
              </div>
            )}
          </div>
          <ThemeToggle collapsed={collapsed} />
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Sair' : undefined}
            aria-label="Sair"
            style={collapsed ? iconButton : {
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '8px 12px',
              background: 'transparent', border: '1px solid var(--line)',
              borderRadius: '8px', color: 'var(--text)',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <NavIcon name="sair" size={18} />
            {!collapsed && 'Sair'}
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="mentoria-platform-main" style={{ flex: 1, minWidth: 0, padding: '40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
