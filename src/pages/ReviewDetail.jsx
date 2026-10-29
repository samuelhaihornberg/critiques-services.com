import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useReviews, EMOJI_REACTIONS } from '../hooks/useReviews'
import { useAuth } from '../hooks/useAuth'
import Comments from '../components/Comments'
import './ReviewDetail.css'

export default function ReviewDetail() {
  const { id } = useParams()
  const { reviews, getReview, voteReview, getComments, createComment, voteComment, addReaction, removeReaction, hasUserReacted, loading: reviewsLoading } = useReviews()
  const { user, isAuthenticated } = useAuth()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [activeProofIndex, setActiveProofIndex] = useState(0)
  const [showAllReactions, setShowAllReactions] = useState(false)
  const [userReactions, setUserReactions] = useState({})

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
          // Check user reactions
          if (user && found.reactions) {
            const reactions = {}
            for (const emoji of Object.keys(found.reactions)) {
              const hasReacted = await hasUserReacted(id, user.id, emoji)
              reactions[emoji] = hasReacted
            }
            setUserReactions(reactions)
          }
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
  }, [id, reviews, getReview, user, hasUserReacted])

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

  const handleReaction = async (emoji) => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour réagir')
      return
    }
    const hasReacted = userReactions[emoji]
    if (hasReacted) {
      await removeReaction(id, user.id, emoji)
      setUserReactions(prev => ({ ...prev, [emoji]: false }))
      setReview(prev => {
        if (!prev) return null
        const reactions = { ...prev.reactions }
        reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1)
        if (reactions[emoji] === 0) delete reactions[emoji]
        return { ...prev, reactions }
      })
    } else {
      await addReaction(id, user.id, user.authorName || 'Utilisateur', user.authorAvatar || null, emoji)
      setUserReactions(prev => ({ ...prev, [emoji]: true }))
      setReview(prev => {
        if (!prev) return null
        const reactions = { ...prev.reactions }
        reactions[emoji] = (reactions[emoji] || 0) + 1
        return { ...prev, reactions }
      })
    }
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

  const formatPrice = (price, currency) => {
    if (price === null || price === undefined) return 'Non spécifié'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2
    }).format(price)
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
  const proofs = review.proofs || []
  const hasProofs = proofs.length > 0
  const reactions = review.reactions || {}

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
            {hasProofs && (
              <span className="proofs-badge" title={`${proofs.length} preuve${proofs.length > 1 ? 's' : ''}`}>📎 {proofs.length}</span>
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

      {/* Proofs Gallery */}
      {hasProofs && (
        <section className="detail-proofs" aria-labelledby="proofs-title">
          <h2 id="proofs-title" className="section-title">Preuves ({proofs.length})</h2>
          <div className="proofs-gallery">
            {proofs.map((proof, index) => (
              <div
                key={index}
                className={`proof-item ${activeProofIndex === index ? 'active' : ''}`}
                onClick={() => setActiveProofIndex(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveProofIndex(index); }}}
              >
                {proof.type === 'image' && <img src={proof.url} alt={proof.caption || `Preuve ${index + 1}`} loading="lazy" />}
                {proof.type === 'video' && (
                  <video src={proof.url} preload="metadata" muted>
                    <source src={proof.url} type="video/mp4" />
                  </video>
                )}
                {proof.type === 'audio' && (
                  <audio src={proof.url} controls preload="metadata">
                    <source src={proof.url} type="audio/mpeg" />
                  </audio>
                )}
                {proof.type === 'document' && (
                  <div className="document-proof">
                    <span className="doc-icon">📄</span>
                    <span className="doc-name">{proof.fileName || proof.caption || 'Document'}</span>
                  </div>
                )}
                {proof.caption && <span className="proof-caption">{proof.caption}</span>}
                <span className="proof-type-badge">{proof.type === 'image' ? '🖼️' : proof.type === 'video' ? '🎥' : proof.type === 'audio' ? '🎵' : '📄'}</span>
              </div>
            ))}
          </div>
          {proofs.length > 4 && (
            <div className="proofs-nav">
              <button className="proof-nav-btn" onClick={() => setActiveProofIndex(i => i > 0 ? i - 1 : proofs.length - 1)} aria-label="Précédent">‹</button>
              <span className="proof-counter">{activeProofIndex + 1} / {proofs.length}</span>
              <button className="proof-nav-btn" onClick={() => setActiveProofIndex(i => (i + 1) % proofs.length)} aria-label="Suivant">›</button>
            </div>
          )}
        </section>
      )}

      {/* Author Comment */}
      {review.authorComment && (
        <section className="detail-author-comment" aria-labelledby="author-comment-title">
          <h2 id="author-comment-title" className="section-title">💬 Commentaire de l'auteur</h2>
          <div className="author-comment-content">
            <p>{review.authorComment}</p>
          </div>
        </section>
      )}

      {/* Price Section */}
      {(review.pricePaid !== null && review.pricePaid !== undefined) || (review.priceComparison && review.priceComparison.length > 0) ? (
        <section className="detail-price" aria-labelledby="price-title">
          <h2 id="price-title" className="section-title">💰 Prix et comparatif</h2>
          <div className="price-grid">
            {review.pricePaid !== null && review.pricePaid !== undefined && (
              <div className="price-main">
                <span className="price-label">Prix payé</span>
                <span className="price-value">{formatPrice(review.pricePaid, review.priceCurrency)}</span>
              </div>
            )}
            {review.priceComparison && review.priceComparison.length > 0 && (
              <div className="price-comparison">
                <h3>Comparatif</h3>
                <ul className="comparison-list">
                  {review.priceComparison.map((comp, i) => (
                    <li key={i} className="comparison-item">
                      <div className="comp-info">
                        <span className="comp-name">{comp.serviceName}</span>
                        {comp.note && <span className="comp-note">{comp.note}</span>}
                      </div>
                      <span className="comp-price">{comp.price !== null ? formatPrice(comp.price, comp.currency) : 'N/A'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Video (legacy) */}
      {review.videoUrl && !hasProofs && (
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

      {/* Reactions Bar */}
      <section className="detail-reactions" aria-labelledby="reactions-title">
        <h2 id="reactions-title" className="section-title">Réactions instantanées</h2>
        <div className="reactions-bar">
          {EMOJI_REACTIONS.map(emoji => {
            const count = reactions[emoji] || 0
            const hasReacted = userReactions[emoji]
            return (
              <button
                key={emoji}
                className={`reaction-btn ${hasReacted ? 'reacted' : ''} ${count > 0 ? 'has-count' : ''}`}
                onClick={() => handleReaction(emoji)}
                disabled={!isAuthenticated}
                aria-label={`${count} réaction${count > 1 ? 's' : ''} ${emoji}`}
                aria-pressed={hasReacted}
              >
                <span className="reaction-emoji">{emoji}</span>
                {count > 0 && <span className="reaction-count">{count}</span>}
              </button>
            )
          })}
          {showAllReactions && (
            <button className="reaction-btn more-btn" onClick={() => setShowAllReactions(false)} aria-label="Masquer">
              <span>⋯</span>
            </button>
          )}
          {!showAllReactions && Object.keys(reactions).some(e => !EMOJI_REACTIONS.includes(e)) && (
            <button className="reaction-btn more-btn" onClick={() => setShowAllReactions(true)} aria-label="Voir plus">
              <span>+</span>
            </button>
          )}
        </div>
        {Object.keys(reactions).length > 0 && (
          <div className="reactions-summary">
            <span>Total : {Object.values(reactions).reduce((a, b) => a + b, 0)} réaction(s)</span>
            {isAuthenticated && !Object.values(userReactions).some(v => v) && (
              <span className="reaction-hint">Cliquez pour réagir</span>
            )}
          </div>
        )}
      </section>

      {/* Votes */}
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
        addReaction={addReaction}
        removeReaction={removeReaction}
        hasUserReacted={hasUserReacted}
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