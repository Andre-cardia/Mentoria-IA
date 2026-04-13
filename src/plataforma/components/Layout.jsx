import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLessonProgress } from '../hooks/useLessonProgress';

const NAV_ITEMS = [
  { to: '/inicio',       label: 'Início' },
  { to: '/modulos',      label: 'Cursos & Aulas' },
  { to: '/forum',        label: 'Fórum' },
  { to: '/materiais',    label: 'Materiais' },
  { to: '/avisos',       label: 'Avisos' },
  { to: '/minha-conta',  label: 'Minha Conta' },
];

const linkStyle = (isActive) => ({
  display: 'block',
  padding: '10px 14px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontFamily: 'Space Grotesk, sans-serif',
  fontSize: '.9rem',
  fontWeight: isActive ? 600 : 400,
  color: isActive ? 'var(--accent)' : 'var(--muted)',
  background: isActive ? 'var(--accent-soft)' : 'transparent',
  transition: 'color .15s, background .15s',
});

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

export default function Layout({ children }) {
  const { user, isAdmin, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { getTotalProgress } = useLessonProgress();
  const [modules, setModules] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('modules')
      .select('id, lessons(id)')
      .then(({ data }) => setModules(data ?? []));
  }, [user]);

  const progress = getTotalProgress(modules);

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', paddingLeft: '4px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'var(--accent)', borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '.875rem', color: '#000',
          }}>M</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.1 }}>Mentoria IA</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.6rem', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              Zero-to-Hero
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 14px', marginBottom: '8px' }}>
            Plataforma
          </div>
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => linkStyle(isActive)}>
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div style={{ borderTop: '1px solid var(--line)', margin: '16px 0 8px' }} />
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 14px', marginBottom: '8px' }}>
                Admin
              </div>
              {[
                { to: '/admin/alunos',    label: 'Alunos' },
                { to: '/admin/modulos',   label: 'Módulos & Aulas' },
                { to: '/admin/materiais', label: 'Materiais' },
                { to: '/admin/avisos',    label: 'Avisos' },
                { to: '/admin/progresso', label: 'Progresso' },
              ].map(({ to, label }) => (
                <NavLink key={to} to={to} style={({ isActive }) => linkStyle(isActive)}>
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Progresso */}
        {progress.total > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'rgba(255,106,0,.05)', border: '1px solid rgba(255,106,0,.15)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.6rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Progresso
              </span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--accent)' }}>
                {progress.completed}/{progress.total}
              </span>
            </div>
            <div style={{ height: '3px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(progress.completed / progress.total) * 100}%`,
                background: 'var(--accent)',
                borderRadius: '2px',
                transition: 'width .3s',
              }} />
            </div>
          </div>
        )}

        {/* Footer do sidebar */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', paddingLeft: '4px' }}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--accent-soft)', border: '1px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '.65rem',
                color: 'var(--accent)', flexShrink: 0,
              }}>
                {getInitials(profile?.full_name)}
              </div>
            )}
            <div style={{ fontSize: '.8rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {user?.email}
            </div>
          </div>
          <button onClick={handleSignOut} style={{
            width: '100%', padding: '8px 14px',
            background: 'transparent', border: '1px solid var(--line)',
            borderRadius: '4px', color: 'var(--muted)',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem',
            cursor: 'pointer', textAlign: 'left',
            transition: 'border-color .15s, color .15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
