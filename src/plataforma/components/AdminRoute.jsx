import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function AdminRoute({ children }) {
  const { user, isAdmin, hasCrmAccess, loading } = useAuth();

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
  // A gestão não tem área de aluno: quem não é admin vai para o CRM (comercial) ou volta ao login.
  if (!isAdmin) return <Navigate to={hasCrmAccess ? '/crm/leads' : '/login'} replace />;

  return children;
}
