import { NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '../context/AuthContext';

const ADMIN_NAV = [
  { to: '/admin/alunos',     label: 'Alunos' },
  { to: '/admin/leads',      label: 'CRM Leads' },
  { to: '/admin/modulos',    label: 'Cursos & Aulas' },
  { to: '/admin/materiais',  label: 'Materiais' },
  { to: '/admin/avisos',     label: 'Avisos' },
  { to: '/admin/progresso',  label: 'Progresso' },
  { to: '/admin/blog',       label: 'Blog' },
];

const ALUNO_NAV = [
  { to: '/modulos',   label: '← Área do Aluno' },
];

const linkStyle = (isActive) => ({
  display: 'block', padding: '10px 14px', borderRadius: '4px',
  textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif',
  fontSize: '.9rem', fontWeight: isActive ? 600 : 400,
  color: isActive ? 'var(--accent)' : 'var(--muted)',
  background: isActive ? 'var(--accent-soft)' : 'transparent',
  transition: 'color .15s, background .15s',
});

export default function AdminLayout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: 'var(--bg-2)', borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px', position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo + badge admin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingLeft: '4px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '4px',
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
        <div style={{ marginBottom: '28px', paddingLeft: '4px' }}>
          <span style={{
            fontFamily: 'Space Mono, monospace', fontSize: '.65rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.06em',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            border: '1px solid rgba(255,106,0,.25)', borderRadius: '3px', padding: '2px 8px',
          }}>Admin</span>
        </div>

        {/* Nav admin */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 14px', marginBottom: '8px' }}>
            Gestão
          </div>
          {ADMIN_NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => linkStyle(isActive)}>{label}</NavLink>
          ))}

          <div style={{ borderTop: '1px solid var(--line)', margin: '16px 0 8px' }} />
          {ALUNO_NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} style={() => linkStyle(false)}>{label}</NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
          <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '10px', paddingLeft: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button onClick={handleSignOut} style={{
            width: '100%', padding: '8px 14px', background: 'transparent',
            border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', cursor: 'pointer', textAlign: 'left',
            transition: 'border-color .15s, color .15s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >Sair</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: '40px', overflowY: 'auto' }}>
        {children}
      </main>

      <Toaster position="bottom-right" richColors duration={3000} />
    </div>
  );
}
