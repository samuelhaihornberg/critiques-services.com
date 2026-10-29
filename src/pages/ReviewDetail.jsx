import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
import { useAuth } from '../hooks/useAuth'
import Comments from '../components/Comments'
import './ReviewDetail.css'

export default function ReviewDetail() {
  const { id } = useParams()
  const { reviews, getReview, voteReview, getComments, createComment, voteComment, loading: reviewsLoading } = useReviews()
  const { user, isAuthenticated } = useAuth()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)

  useEffect(() => {
    const loadReview = async () => {
      setLoading(true)
      try {
        let found = reviews.find(r => r.id === id)
        if (!found) {
          found = await getReview(id)
        }
        if (found) {
          setReview(found)
        } else {
          setError('Critique non trouvée')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadReview()
  }, [id, reviews, getReview])

  const handleVote = async (type) => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour voter')
      return
    }
    await voteReview(id, type)
    setReview(prev => prev ? {
      ...prev,
      votes: {
        ...prev.votes,
        [type]: prev.votes[type] + 1
      }
    } : null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2digit',
      minute: '2digit'
    })
  }

  const formatExperienceDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading || reviewsLoading) {
    return (
      <div className="review-detail loading">
        <div className="skeleton detail-skeleton"></div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="review-detail error">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <h2>Critique introuvable</h2>
          <p>{error || 'Cette critique n\'existe pas ou a été supprimée.'}</p>
          <Link to="/reviews" className="btn btn-primary">Retour aux critiques</Link>
        </div>
      </div>
    )
  }

  const isAuthor = user && review.authorId === user.id
  const netVotes = review.votes.up - review.votes.down
  const location = review.location || { address: 'Non spécifié', coords: null, isOnline: false }
  const isOnlineService = location.isOnline || review.category === 'internet' || review.category === 'ecommerce'

  return (
    <article className="review-detail">
      <header className="detail-header">
        <div className="detail-meta">
          <Link to={`/reviews?category=${review.category}`} className="detail-category">
            {review.category}
          </Link>
          <span className="detail-service">{review.serviceName}</span>
        </div>
        <div className="detail-rating" aria-label={`Note globale : ${review.rating} sur 5`}>
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`} aria-hidden="true">★</span>
          ))}
          <span className="rating-value">{review.rating}/5</span>
        </div>
      </header>

      <h1 className="detail-title">{review.title}</h1>

      <div className="detail-author">
        <div className="author-avatar" aria-hidden="true">
          {review.authorAvatar ? (
            <img src={review.authorAvatar} alt="" />
          ) : (
            review.authorName?.[0]?.toUpperCase()
          )}
        </div>
        <div className="author-details">
          <div className="author-name-row">
            <span className="author-name">{review.authorName}</span>
            {review.verified && (
              <span className="verified-badge" title="Critique vérifiée avec preuves">✓ Vérifié</span>
            )}
            {review.videoUrl && (
              <span className="video-badge" title="Contient une vidéo de preuve">📹 Vidéo</span>
            )}
          </div>
          <div className="author-meta">
            <span className="experience-date">
              📅 Expérience du {formatExperienceDate(review.experienceDate || review.createdAt)}
            </span>
            <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
            {review.updatedAt !== review.createdAt && (
              <span>• Modifié le {formatDate(review.updatedAt)}</span>
            )}
          </div>
        </div>
        {isAuthor && (
          <div className="author-actions">
            <Link to={`/edit/${review.id}`} className="btn btn-ghost btn-sm">Modifier</Link>
            <button className="btn btn-danger btn-sm" onClick={() => {
              if (confirm('Supprimer cette critique ?')) {
                // TODO: delete
              }
            }}>Supprimer</button>
          </div>
        )}
      </div>

      <div className="detail-location">
        {isOnlineService ? (
          <div className="location-online">
            <span className="location-icon">🌐</span>
            <div className="location-info">
              <span className="location-label">Service en ligne</span>
              {review.serviceWebsite && (
                <a href={review.serviceWebsite} target="_blank" rel="noopener noreferrer" className="location-link">
                  {new URL(review.serviceWebsite).hostname}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="location-physical">
            <span className="location-icon">📍</span>
            <div className="location-info">
              <span className="location-label">Lieu physique</span>
              <address className="location-address">{location.address}</address>
            </div>
            {location.coords && (
              <div className="location-map">
                <iframe
                  title={`Localisation de ${review.serviceName}`}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.coords.lng - 0.01}%2C${location.coords.lat - 0.01}%2C${location.coords.lng + 0.01}%2C${location.coords.lat + 0.01}&layer=mapnik&marker=${location.coords.lat}%2C${location.coords.lng}`}
                  style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                  width="100%"
                  height="200"
                  allowFullScreen
                  loading="lazy"
                ></iframe>
                <a 
                  href={`https://www.openstreetmap.org/?mlat=${location.coords.lat}&mlon=${location.coords.lng}#map=16/${location.coords.lat}/${location.coords.lng}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  Voir sur OpenStreetMap →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {review.videoUrl && (
        <div className="detail-video">
          <video
            controls
            poster={review.videoThumbnail}
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            preload="metadata"
          >
            <source src={review.videoUrl} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
          <p className="video-caption">Preuve vidéo fournie par l'auteur</p>
        </div>
      )}

      <div className="detail-content">
        <p>{review.content}</p>
      </div>

      {review.tags && review.tags.length > 0 && (
        <div className="detail-tags">
          {review.tags.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="detail-votes">
        <button
          className={`vote-btn large up ${netVotes > 0 ? 'active' : ''}`}
          onClick={() => handleVote('up')}
          disabled={!isAuthenticated}
          aria-label={`${review.votes.up} votes pour, ${review.votes.down} contre`}
          aria-pressed={netVotes > 0}
        >
          <span className="vote-icon">👍</span>
          <span className="vote-count">{review.votes.up}</span>
        </button>
        <div className="vote-score" aria-label={`Score net : ${netVotes > 0 ? '+' : ''}${netVotes}`}>
          {netVotes > 0 ? '+' : ''}{netVotes}
        </div>
        <button
          className={`vote-btn large down ${netVotes < 0 ? 'active' : ''}`}
          onClick={() => handleVote('down')}
          disabled={!isAuthenticated}
          aria-label={`${review.votes.down} votes contre, ${review.votes.up} pour`}
          aria-pressed={netVotes < 0}
        >
          <span className="vote-icon">👎</span>
          <span className="vote-count">{review.votes.down}</span>
        </button>
      </div>

      <Comments
        reviewId={id}
        initialComments={[]}
        onLoadComments={async (reviewId) => {
          if (commentsLoaded) return []
          setCommentsLoaded(true)
          return getComments(reviewId)
        }}
        createComment={createComment}
        voteComment={voteComment}
      />

      <nav className="detail-nav" aria-label="Navigation">
        <Link to="/reviews" className="btn btn-secondary">
          ← Retour à la liste
        </Link>
        <Link to="/create" className="btn btn-primary">
          <span>📝</span> Publier ma critique
        </Link>
      </nav>
    </article>
  )
}