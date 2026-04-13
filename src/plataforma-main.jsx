import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './plataforma/context/AuthContext';
import ProtectedRoute from './plataforma/components/ProtectedRoute';
import AdminRoute from './plataforma/components/AdminRoute';
import ProfileGuard from './plataforma/components/ProfileGuard';
import LoginPage from './plataforma/pages/LoginPage';
import RegisterPage from './plataforma/pages/RegisterPage';
import CompletarPerfilPage from './plataforma/pages/CompletarPerfilPage';

// Lazy-load para code splitting
const DashboardPage    = lazy(() => import('./plataforma/pages/DashboardPage'));
const ModulosPage      = lazy(() => import('./plataforma/pages/ModulosPage'));
const ForumPage        = lazy(() => import('./plataforma/pages/ForumPage'));
const MateriaisPage    = lazy(() => import('./plataforma/pages/MateriaisPage'));
const AvisosPage       = lazy(() => import('./plataforma/pages/AvisosPage'));
const AdminAlunosPage    = lazy(() => import('./plataforma/pages/admin/AdminAlunosPage'));
const AdminModulosPage   = lazy(() => import('./plataforma/pages/admin/AdminModulosPage'));
const AdminAulasPage   = lazy(() => import('./plataforma/pages/admin/AdminAulasPage'));
const AdminMateriaisPage = lazy(() => import('./plataforma/pages/admin/AdminMateriaisPage'));
const AdminAvisosPage    = lazy(() => import('./plataforma/pages/admin/AdminAvisosPage'));
const LessonPage         = lazy(() => import('./plataforma/pages/LessonPage'));
const AdminProgressoPage = lazy(() => import('./plataforma/pages/admin/AdminProgressoPage'));
const MinhaContaPage     = lazy(() => import('./plataforma/pages/MinhaContaPage'));

const Fallback = () => (
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
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />

            {/* Perfil — autenticado mas sem guard (evita loop) */}
            <Route path="/completar-perfil" element={<ProtectedRoute><CompletarPerfilPage /></ProtectedRoute>} />

            {/* Área do Aluno (autenticado + perfil completo) */}
            <Route path="/inicio"    element={<ProtectedRoute><ProfileGuard><DashboardPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/modulos"   element={<ProtectedRoute><ProfileGuard><ModulosPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/modulos/:moduleId/aulas/:lessonId" element={<ProtectedRoute><ProfileGuard><LessonPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/forum"     element={<ProtectedRoute><ProfileGuard><ForumPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/materiais" element={<ProtectedRoute><ProfileGuard><MateriaisPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/avisos"    element={<ProtectedRoute><ProfileGuard><AvisosPage /></ProfileGuard></ProtectedRoute>} />
            <Route path="/minha-conta" element={<ProtectedRoute><ProfileGuard><MinhaContaPage /></ProfileGuard></ProtectedRoute>} />

            {/* Área de Admin */}
            <Route path="/admin/alunos"     element={<AdminRoute><AdminAlunosPage /></AdminRoute>} />
            <Route path="/admin/modulos"    element={<AdminRoute><AdminModulosPage /></AdminRoute>} />
            <Route path="/admin/aulas"      element={<AdminRoute><AdminAulasPage /></AdminRoute>} />
            <Route path="/admin/materiais"  element={<AdminRoute><AdminMateriaisPage /></AdminRoute>} />
            <Route path="/admin/avisos"     element={<AdminRoute><AdminAvisosPage /></AdminRoute>} />
            <Route path="/admin/progresso"  element={<AdminRoute><AdminProgressoPage /></AdminRoute>} />

            {/* Redirect padrão */}
            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
