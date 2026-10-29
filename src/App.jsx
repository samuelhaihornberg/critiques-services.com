import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ReviewList from './pages/ReviewList'
import ReviewDetail from './pages/ReviewDetail'
import CreateReview from './pages/CreateReview'
import Profile from './pages/Profile'
import Login from './pages/Login'
import { AuthProvider } from './hooks/useAuth'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '2rem', textAlign: 'center',
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
        }}>
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 800,
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Erreur d'application
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              Une erreur inattendue s'est produite. Veuillez actualiser la page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem 1.5rem', borderRadius: 'var(--radius-md)',
                fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none',
                border: '2px solid transparent', background: 'var(--accent-primary)',
                color: 'var(--text-primary)', borderColor: 'var(--accent-primary)',
                cursor: 'pointer'
              }}
            >
              Actualiser la page
            </button>
            {this.state.error && (
              <details style={{ marginTop: '2rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <summary>Détails techniques</summary>
                <pre style={{ marginTop: '1rem', overflow: 'auto', maxHeight: '200px' }}>
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="reviews" element={<ReviewList />} />
            <Route path="reviews/:id" element={<ReviewDetail />} />
            <Route path="create" element={<CreateReview />} />
            <Route path="profile" element={<Profile />} />
            <Route path="login" element={<Login />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App