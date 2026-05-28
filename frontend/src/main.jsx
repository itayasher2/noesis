import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Init theme (dark-first)
const saved = localStorage.getItem('vp-theme') !== 'light' ? 'dark' : 'light';
document.documentElement.className = saved;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)