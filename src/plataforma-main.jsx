import { StrictMode, lazy, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './plataforma/context/AuthContext';
import ProtectedRoute from './plataforma/components/ProtectedRoute';
import ProfileGuard from './plataforma/components/ProfileGuard';
import { GESTAO_BASE } from './lib/app-env';
import LoginPage from './plataforma/pages/LoginPage';
import RegisterPage from './plataforma/pages/RegisterPage';
import CompletarPerfilPage from './plataforma/pages/CompletarPerfilPage';
import ForgotPasswordPage from './plataforma/pages/ForgotPasswordPage';
import ResetPasswordPage from './plataforma/pages/ResetPasswordPage';

// Lazy-load para code splitting
export const DashboardPage    = lazy(() => import('./plataforma/pages/DashboardPage'));
export const CursosPage       = lazy(() => import('./plataforma/pages/CursosPage'));
export const CursoPage        = lazy(() => import('./plataforma/pages/CursoPage'));
export const FormacoesPage    = lazy(() => import('./plataforma/pages/FormacoesPage'));
export const ForumPage        = lazy(() => import('./plataforma/pages/ForumPage'));
export const MateriaisPage    = lazy(() => import('./plataforma/pages/MateriaisPage'));
export const AvisosPage       = lazy(() => import('./plataforma/pages/AvisosPage'));
export const LessonPage         = lazy(() => import('./plataforma/pages/LessonPage'));
export const MinhaContaPage         = lazy(() => import('./plataforma/pages/MinhaContaPage'));
export const PlataformaBlogPage     = lazy(() => import('./plataforma/pages/PlataformaBlogPage'));
export const PlataformaBlogPostPage = lazy(() => import('./plataforma/pages/PlataformaBlogPostPage'));

export function LegacyLessonRedirect() {
  const { moduleId, lessonId } = useParams();
  return <Navigate to={`/cursos/${moduleId}/aulas/${lessonId}`} replace />;
}

// Links antigos (/plataforma/admin/..., /plataforma/crm/...) saem deste app
// e caem no ambiente de gestão, que tem login próprio.
export function GestaoRedirect() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.location.replace(`${GESTAO_BASE}${pathname}${search}`);
  }, [pathname, search]);
  return <Fallback />;
}

export const Fallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
    <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>Carregando...</span>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter basename="/plataforma">
        <Suspense fallback={<Fallback />}>
          <Routes>
            {/* Pública */}
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/registro"        element={<RegisterPage />} />
            <Route path="/esqueci-senha"   element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

            {/* Perfil — autenticado mas sem guard (evita loop) */}
            <Route path="/completar-perfil" element={<ProtectedRoute><CompletarPerfilPage /></ProtectedRoute>} />

            {/* Área do Aluno (autenticado + perfil completo) */}
            <Route path="/inicio"    element={<ProtectedRoute><ProfileGuard><DashboardPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/cursos"    element={<ProtectedRoute><ProfileGuard><CursosPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/formacoes" element={<ProtectedRoute><ProfileGuard><FormacoesPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/cursos/:moduleId" element={<ProtectedRoute><ProfileGuard><CursoPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/cursos/:moduleId/aulas/:lessonId" element={<ProtectedRoute><ProfileGuard><LessonPage /></ProfileGuard></ProtectedRoute>} />
            {/* Redirecionamentos de rotas legadas */}
            <Route path="/modulos" element={<Navigate to="/cursos" replace />} />
            <Route path="/modulos/:moduleId/aulas/:lessonId" element={<LegacyLessonRedirect />} />
            <Route path="/forum"     element={<ProtectedRoute><ProfileGuard><ForumPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/materiais" element={<ProtectedRoute><ProfileGuard><MateriaisPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/avisos"    element={<ProtectedRoute><ProfileGuard><AvisosPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/minha-conta" element={<ProtectedRoute><ProfileGuard><MinhaContaPage /></ProfileGuard></ProtectedRoute>} />

            {/* Admin e CRM mudaram para o ambiente de gestão (/gestao) */}
            <Route path="/admin/*" element={<GestaoRedirect />} />
            <Route path="/crm/*"   element={<GestaoRedirect />} />

            {/* Blog da plataforma (alunos autenticados) */}
            <Route path="/blog"       element={<ProtectedRoute><ProfileGuard><PlataformaBlogPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/blog/:slug" element={<ProtectedRoute><ProfileGuard><PlataformaBlogPostPage /></ProfileGuard></ProtectedRoute>} />

            {/* Redirect padrão */}
            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
