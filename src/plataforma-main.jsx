import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './plataforma/context/AuthContext';
import ProtectedRoute from './plataforma/components/ProtectedRoute';
import AdminRoute from './plataforma/components/AdminRoute';
import LoginPage from './plataforma/pages/LoginPage';

// Lazy-load para code splitting
const ModulosPage      = lazy(() => import('./plataforma/pages/ModulosPage'));
const ForumPage        = lazy(() => import('./plataforma/pages/ForumPage'));
const MateriaisPage    = lazy(() => import('./plataforma/pages/MateriaisPage'));
const AvisosPage       = lazy(() => import('./plataforma/pages/AvisosPage'));
const AdminModulosPage = lazy(() => import('./plataforma/pages/admin/AdminModulosPage'));
const AdminAulasPage   = lazy(() => import('./plataforma/pages/admin/AdminAulasPage'));
const AdminMateriaisPage = lazy(() => import('./plataforma/pages/admin/AdminMateriaisPage'));
const AdminAvisosPage  = lazy(() => import('./plataforma/pages/admin/AdminAvisosPage'));

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
            <Route path="/login" element={<LoginPage />} />

            {/* Área do Aluno (autenticado) */}
            <Route path="/modulos"   element={<ProtectedRoute><ModulosPage /></ProtectedRoute>} />
            <Route path="/forum"     element={<ProtectedRoute><ForumPage /></ProtectedRoute>} />
            <Route path="/materiais" element={<ProtectedRoute><MateriaisPage /></ProtectedRoute>} />
            <Route path="/avisos"    element={<ProtectedRoute><AvisosPage /></ProtectedRoute>} />

            {/* Área de Admin */}
            <Route path="/admin/modulos"   element={<AdminRoute><AdminModulosPage /></AdminRoute>} />
            <Route path="/admin/aulas"     element={<AdminRoute><AdminAulasPage /></AdminRoute>} />
            <Route path="/admin/materiais" element={<AdminRoute><AdminMateriaisPage /></AdminRoute>} />
            <Route path="/admin/avisos"    element={<AdminRoute><AdminAvisosPage /></AdminRoute>} />

            {/* Redirect padrão */}
            <Route path="*" element={<Navigate to="/modulos" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
