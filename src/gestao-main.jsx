import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './plataforma/context/AuthContext';
import { useAuth } from './plataforma/context/useAuth';
import AdminRoute from './plataforma/components/AdminRoute';
import CrmRoute from './plataforma/components/CrmRoute';
import LoginPage from './plataforma/pages/LoginPage';
import ForgotPasswordPage from './plataforma/pages/ForgotPasswordPage';
import ResetPasswordPage from './plataforma/pages/ResetPasswordPage';
import { GESTAO_BASE } from './lib/app-env';

// Ambiente de gestão: administrativo (admin) e comercial (CRM).
// Login e sessão próprios, separados da plataforma de ensino.

export const AdminAlunosPage     = lazy(() => import('./plataforma/pages/admin/AdminAlunosPage'));
export const AdminUsuariosPage   = lazy(() => import('./plataforma/pages/admin/AdminUsuariosPage'));
export const AdminLeadsPage      = lazy(() => import('./plataforma/pages/admin/AdminLeadsPage'));
export const AdminModulosPage    = lazy(() => import('./plataforma/pages/admin/AdminModulosPage'));
export const AdminAulasPage      = lazy(() => import('./plataforma/pages/admin/AdminAulasPage'));
export const AdminMateriaisPage  = lazy(() => import('./plataforma/pages/admin/AdminMateriaisPage'));
export const AdminAvisosPage     = lazy(() => import('./plataforma/pages/admin/AdminAvisosPage'));
export const AdminProgressoPage  = lazy(() => import('./plataforma/pages/admin/AdminProgressoPage'));
export const AdminBlogPage       = lazy(() => import('./plataforma/pages/admin/AdminBlogPage'));
export const AdminBlogEditorPage = lazy(() => import('./plataforma/pages/admin/AdminBlogEditorPage'));
export const CrmReportsPage      = lazy(() => import('./plataforma/pages/admin/CrmReportsPage'));
export const CrmClientesPage     = lazy(() => import('./plataforma/pages/admin/CrmClientesPage'));

export const Fallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
    <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>Carregando...</span>
  </div>
);

// Entrada do ambiente: cada papel cai na sua área; sem papel de equipe, login.
export function HomeRedirect() {
  const { user, isAdmin, hasCrmAccess, loading } = useAuth();
  if (loading) return <Fallback />;
  if (!user || !hasCrmAccess) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin/alunos' : '/crm/leads'} replace />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter basename={GESTAO_BASE}>
        <Suspense fallback={<Fallback />}>
          <Routes>
            {/* Pública */}
            <Route path="/login"           element={<LoginPage area="gestao" />} />
            <Route path="/esqueci-senha"   element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

            {/* Administrativo */}
            <Route path="/admin/alunos"           element={<AdminRoute><AdminAlunosPage /></AdminRoute>} />
            <Route path="/admin/usuarios"         element={<AdminRoute><AdminUsuariosPage /></AdminRoute>} />
            <Route path="/admin/leads"            element={<CrmRoute><Navigate to="/crm/leads" replace /></CrmRoute>} />
            <Route path="/admin/modulos"          element={<AdminRoute><AdminModulosPage /></AdminRoute>} />
            <Route path="/admin/aulas"            element={<AdminRoute><AdminAulasPage /></AdminRoute>} />
            <Route path="/admin/materiais"        element={<AdminRoute><AdminMateriaisPage /></AdminRoute>} />
            <Route path="/admin/avisos"           element={<AdminRoute><AdminAvisosPage /></AdminRoute>} />
            <Route path="/admin/progresso"        element={<AdminRoute><AdminProgressoPage /></AdminRoute>} />
            <Route path="/admin/blog"             element={<AdminRoute><AdminBlogPage /></AdminRoute>} />
            <Route path="/admin/blog/novo"        element={<AdminRoute><AdminBlogEditorPage /></AdminRoute>} />
            <Route path="/admin/blog/:id/editar"  element={<AdminRoute><AdminBlogEditorPage /></AdminRoute>} />

            {/* Comercial */}
            <Route path="/crm/leads"      element={<CrmRoute><AdminLeadsPage /></CrmRoute>} />
            <Route path="/crm/clientes"   element={<CrmRoute><CrmClientesPage /></CrmRoute>} />
            <Route path="/crm/relatorios" element={<CrmRoute><CrmReportsPage /></CrmRoute>} />

            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
