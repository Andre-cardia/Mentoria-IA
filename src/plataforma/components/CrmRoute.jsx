import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CrmRoute({ children }) {
  const { user, hasCrmAccess, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>
          Verificando permissões...
        </span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!hasCrmAccess) return <Navigate to="/inicio" replace />;

  return children;
}
