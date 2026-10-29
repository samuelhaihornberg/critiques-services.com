import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

// Show loading until React mounts
const rootEl = document.getElementById('root')
const fallback = document.getElementById('spa-fallback')

function hideFallback() {
  if (fallback) {
    fallback.style.display = 'none'
  }
}

// Hide fallback when React starts rendering
if (rootEl) {
  const observer = new MutationObserver(() => {
    if (rootEl.children.length > 0) {
      const hasRealContent = Array.from(rootEl.children).some(child =>
        child !== fallback && child.tagName !== 'SCRIPT'
      )
      if (hasRealContent) {
        hideFallback()
        observer.disconnect()
      }
    }
  })
  observer.observe(rootEl, { childList: true, subtree: true })
}

// Timeout fallback
setTimeout(hideFallback, 8000)

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
).catch(err => {
  console.error('React root render error:', err)
  hideFallback()
  // Show error in fallback
  if (fallback) {
    fallback.innerHTML = `
      <div style="padding:2rem;text-align:center;color:var(--text-secondary)">
        <div style="font-size:4rem;margin-bottom:1rem">⚠️</div>
        <h1 style="font-size:clamp(1.5rem,4vw,2.5rem);font-weight:800;margin-bottom:1rem;
          background:linear-gradient(135deg,var(--text-primary) 0%,var(--accent-secondary) 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
          Erreur de chargement
        </h1>
        <p style="margin-bottom:2rem;max-width:400px;margin:0 auto 2rem">L'application n'a pas pu démarrer.</p>
        <button onclick="location.reload()" style="
          display:inline-flex;align-items:center;gap:0.5rem;padding:0.875rem 1.5rem;
          border-radius:12px;font-weight:600;font-size:0.95rem;text-decoration:none;
          border:2px solid transparent;background:var(--accent-primary);color:var(--text-primary);
          border-color:var(--accent-primary);cursor:pointer">
          Réessayer
        </button>
      `
    fallback.style.display = 'flex'
  }
})