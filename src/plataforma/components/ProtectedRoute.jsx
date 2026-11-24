import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { FIRST_ACCESS_PATH } from '../../lib/app-env';
import { requiresFirstAccessPasswordChange } from '../../../shared/first-access.js';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>
          Carregando...
        </span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiresFirstAccessPasswordChange(user)) {
    return <Navigate to={user.app_metadata?.role === 'comercial' ? '/crm/leads' : FIRST_ACCESS_PATH} replace />;
  }

  return children;
}
