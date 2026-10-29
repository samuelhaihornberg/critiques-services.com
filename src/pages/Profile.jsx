import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useReviews } from '../hooks/useReviews'
import { Link } from 'react-router-dom'
import './Profile.css'

export default function Profile() {
  const { user, updateProfile, logout, isAuthenticated } = useAuth()
  const { getReviewsByAuthor } = useReviews()
  const [activeTab, setActiveTab] = useState('reviews')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    authorName: user?.authorName || '',
    email: user?.email || ''
  })
  const [avatarPreview, setAvatarPreview] = useState(null)

  const userReviews = getReviewsByAuthor(user?.id)

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 2 Mo')
        return
      }
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
      setEditData(prev => ({ ...prev, authorAvatar: url }))
    }
  }

  const saveProfile = () => {
    updateProfile(editData)
    setEditing(false)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
  }

  const cancelEdit = () => {
    setEditData({ authorName: user?.authorName || '', email: user?.email || '' })
    setEditing(false)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="profile-empty">
          <h2>Connexion requise</h2>
          <p>Connectez-vous pour accéder à votre profil</p>
          <Link to="/login" className="btn btn-primary">Se connecter</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {avatarPreview || user?.authorAvatar ? (
              <img src={avatarPreview || user.authorAvatar} alt="" />
            ) : (
              user?.authorName?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          {editing && (
            <label className="avatar-upload">
              <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
              <span>📷</span>
            </label>
          )}
        </div>
        
        <div className="profile-info">
          {editing ? (
            <div className="profile-edit-form">
              <div className="form-group">
                <label htmlFor="authorName" className="form-label">Nom d'affichage</label>
                <input
                  id="authorName"
                  name="authorName"
                  type="text"
                  value={editData.authorName}
                  onChange={handleEditChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={editData.email}
                  onChange={handleEditChange}
                  className="form-input"
                  disabled
                />
                <span className="form-hint">L'email ne peut pas être modifié</span>
              </div>
              <div className="edit-actions">
                <button onClick={saveProfile} className="btn btn-primary">Enregistrer</button>
                <button onClick={cancelEdit} className="btn btn-secondary">Annuler</button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="profile-name">{user.authorName || 'Utilisateur'}</h1>
              <p className="profile-email">{user.email}</p>
              <p className="profile-member-since">
                Membre depuis {formatDate(user.createdAt)}
              </p>
              <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm">
                ✏️ Modifier le profil
              </button>
            </>
          )}
        </div>
      </header>

      <nav className="profile-tabs" aria-label="Sections du profil">
        <button 
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Mes critiques ({userReviews.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistiques
        </button>
      </nav>

      <div className="profile-content">
        {activeTab === 'reviews' && (
          <div className="reviews-tab">
            {userReviews.length === 0 ? (
              <div className="empty-state">
                <p>Vous n'avez pas encore publié de critique.</p>
                <Link to="/create" className="btn btn-primary">Publier ma première critique</Link>
              </div>
            ) : (
              <div className="user-reviews-list">
                {userReviews.map(review => (
                  <article key={review.id} className="user-review-card">
                    <div className="user-review-header">
                      <div className="user-review-meta">
                        <span className="review-category">{review.category}</span>
                        <span className="review-service">{review.serviceName}</span>
                      </div>
                      <div className="user-review-rating">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <Link to={`/reviews/${review.id}`} className="user-review-title">
                      {review.title}
                    </Link>
                    <div className="user-review-meta-bottom">
                      <span className="review-date">{formatDate(review.createdAt)}</span>
                      <span className="review-votes-summary">
                        👍 {review.votes.up} · 👎 {review.votes.down}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{userReviews.length}</span>
                <span className="stat-label">Critiques publiées</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{userReviews.filter(r => r.rating >= 4).length}</span>
                <span className="stat-label">Expériences positives</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{userReviews.filter(r => r.rating <= 2).length}</span>
                <span className="stat-label">Abus signalés</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {userReviews.reduce((sum, r) => sum + r.votes.up, 0)}
                </span>
                <span className="stat-label">Votes positifs reçus</span>
              </div>
            </div>
            
            <div className="rating-distribution">
              <h3>Répartition des notes</h3>
              <div className="rating-bars">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = userReviews.filter(r => r.rating === star).length
                  const percentage = userReviews.length > 0 ? (count / userReviews.length) * 100 : 0
                  return (
                    <div key={star} className="rating-bar">
                      <span className="rating-bar-label">{star}★</span>
                      <div className="rating-bar-track">
                        <div 
                          className="rating-bar-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="rating-bar-count">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="profile-danger-zone">
        <h3>Zone de danger</h3>
        <button onClick={logout} className="btn btn-danger">Se déconnecter</button>
      </div>
    </div>
  )
}