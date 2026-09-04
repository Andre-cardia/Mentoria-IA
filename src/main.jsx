import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import LandingPageMentoriaIA from '../landing_page_mentoria_ia_react.jsx'

export const BlogPage     = lazy(() => import('./pages/BlogPage.jsx'))
export const BlogPostPage = lazy(() => import('./pages/BlogPostPage.jsx'))
export const ProposalPage = lazy(() => import('./pages/ProposalPage.jsx'))
export const OrsegupsGovernancaPage = lazy(() => import('./pages/OrsegupsGovernancaSuite.jsx').then((m) => ({ default: m.OrsegupsGovernancaPage })))
export const OrsegupsGovernancaTestePage = lazy(() => import('./pages/OrsegupsGovernancaSuite.jsx').then((m) => ({ default: m.OrsegupsGovernancaTestePage })))
export const OrsegupsGovernancaFrameworkPage = lazy(() => import('./pages/OrsegupsGovernancaSuite.jsx').then((m) => ({ default: m.OrsegupsGovernancaFrameworkPage })))

export const Fallback = () => (
  <div style={{ minHeight: '100vh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: '#666', fontFamily: 'monospace', fontSize: '.875rem' }}>Carregando...</span>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/blog"       element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/solicitar-proposta" element={<ProposalPage />} />
            <Route path="/governanca-ia" element={<OrsegupsGovernancaPage />} />
            <Route path="/governanca-ia/teste" element={<OrsegupsGovernancaTestePage />} />
            <Route path="/governanca-ia/framework" element={<OrsegupsGovernancaFrameworkPage />} />
            <Route path="/aulas/governanca-ia" element={<OrsegupsGovernancaPage />} />
            <Route path="/aulas/governanca-ia/teste" element={<OrsegupsGovernancaTestePage />} />
            <Route path="/aulas/governanca-ia/framework" element={<OrsegupsGovernancaFrameworkPage />} />
            <Route path="*"           element={<LandingPageMentoriaIA />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
