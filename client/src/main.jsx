// React entry point: mounts App into #root with StrictMode
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Global styles and dashboard-specific styles
import './index.css'
import './styles/dashboard.css'
// Root application component with routing and providers
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
