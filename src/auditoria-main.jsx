import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import AuditoriaPage from './pages/AuditoriaPage.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuditoriaPage />
    </HelmetProvider>
  </React.StrictMode>
)
