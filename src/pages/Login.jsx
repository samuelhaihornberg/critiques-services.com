import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('Email et mot de passe requis')
        return
      }
    } else {
      if (!formData.name.trim()) {
        setError('Le nom est requis')
        return
      }
      if (!formData.email || !formData.password) {
        setError('Email et mot de passe requis')
        return
      }
      if (formData.password.length < 6) {
        setError('Le mot de passe doit faire au moins 6 caractères')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }
    }

    setSubmitting(true)
    try {
      // Simulate auth - in real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const userData = {
        authorName: isLogin ? formData.email.split('@')[0] : formData.name.trim(),
        email: formData.email,
        authorAvatar: null
      }
      
      login(userData)
      navigate('/')
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Critiques Services</h1>
          <p>{isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name" className="form-label">Nom d'affichage <span className="required">*</span></label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Votre nom ou pseudo"
                className="form-input"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email <span className="required">*</span></label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="vous@exemple.com"
              className="form-input"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Mot de passe <span className="required">*</span></label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="form-input"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirmer le mot de passe <span className="required">*</span></label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="form-input"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer mon compte')}
          </button>
        </form>

        <div className="login-toggle">
          <p>
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="toggle-link">
              {isLogin ? 'S\'inscrire' : 'Se connecter'}
            </button>
          </p>
        </div>

        <div className="login-info">
          <p>💡 <strong>Rappel :</strong> Seules les expériences vécues personnellement sont acceptées. Pas de faux avis, pas de simulation.</p>
        </div>
      </div>
    </div>
  )
}