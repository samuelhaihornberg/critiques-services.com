import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Layout.css'

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Accueil', icon: '🏠' },
    { path: '/reviews', label: 'Critiques', icon: '📝' },
    { path: '/create', label: 'Publier', icon: '➕', auth: true }
  ]

  const userNavItems = [
    { path: '/profile', label: 'Mon profil', icon: '👤' },
    { path: '/reviews', label: 'Mes critiques', icon: '📋' }
  ]

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo" aria-label="Critiques Services - Accueil">
            <span className="logo-icon">⚖️</span>
            <span className="logo-text">Critiques Services</span>
          </Link>

          <nav className="nav-main" aria-label="Navigation principale">
            <ul className="nav-list">
              {navItems.map(item => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    aria-current={location.pathname === item.path ? 'page' : undefined}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            {isAuthenticated ? (
              <div className="user-menu">
                <Link to="/profile" className="user-avatar" aria-label="Mon profil">
                  {user?.authorAvatar ? (
                    <img src={user.authorAvatar} alt="" />
                  ) : (
                    <span>{user?.authorName?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </Link>
                <div className="user-dropdown">
                  <span className="user-name">{user?.authorName || 'Utilisateur'}</span>
                  <nav aria-label="Menu utilisateur">
                    <ul>
                      {userNavItems.map(item => (
                        <li key={item.path}>
                          <Link to={item.path}>
                            <span>{item.icon}</span>
                            {item.label}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <button onClick={logout} className="logout-btn">
                          <span>🚪</span> Déconnexion
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary">
                <span>🔐</span> Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="main-content" role="main">
        <Outlet />
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-content">
          <p>Critiques Services - Plateforme indépendante d'avis sur les services</p>
          <p className="footer-legal">
            <Link to="/mentions-legales">Mentions légales</Link> •
            <Link to="/cgu">CGU</Link> •
            <Link to="/confidentialite">Confidentialité</Link> •
            <Link to="/contact">Contact</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}