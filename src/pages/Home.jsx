import { Link } from 'react-router-dom'
import { useReviews, CATEGORIES } from '../hooks/useReviews'
import './Home.css'

export default function Home() {
  const { reviews, loading } = useReviews()
  const featuredReviews = reviews.slice(0, 6)
  const stats = {
    total: reviews.length,
    positive: reviews.filter(r => r.rating >= 4).length,
    negative: reviews.filter(r => r.rating <= 2).length,
    verified: reviews.filter(r => r.verified).length
  }

  if (loading) {
    return (
      <div className="home loading">
        <div className="skeleton hero-skeleton"></div>
        <div className="skeleton stats-skeleton"></div>
        <div className="categories-skeleton">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton category-skeleton" />)}
        </div>
        <div className="reviews-skeleton">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton review-skeleton" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <h1 id="hero-title" className="hero-title">
            Vos expériences,<br />
            <span className="highlight">leurs vérités</span>
          </h1>
          <p className="hero-subtitle">
            Partagez vos expériences réelles avec preuves vidéo. 
            Dénoncez les abus, valorisez l'excellence. 
            Ensemble, faisons changer les services.
          </p>
          <div className="hero-actions">
            <Link to="/create" className="btn btn-primary btn-lg">
              <span>📹</span> Publier ma critique
            </Link>
            <Link to="/reviews" className="btn btn-secondary btn-lg">
              <span>🔍</span> Explorer les avis
            </Link>
          </div>
        </div>
        <div className="hero-stats" role="region" aria-label="Statistiques de la plateforme">
          <div className="stat">
            <span className="stat-value">{stats.total}+</span>
            <span className="stat-label">Critiques publiées</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.verified}+</span>
            <span className="stat-label">Vérifiées avec preuves</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.positive}</span>
            <span className="stat-label">Expériences positives</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.negative}</span>
            <span className="stat-label">Abus signalés</span>
          </div>
        </div>
      </section>

      <section className="categories" aria-labelledby="categories-title">
        <h2 id="categories-title" className="section-title">Par catégorie</h2>
        <div className="categories-grid">
          {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
            <Link
              key={cat.id}
              to={`/reviews?category=${cat.id}`}
              className="category-card"
              aria-label={`${cat.label} - ${cat.icon}`}
            >
              <span className="category-icon" aria-hidden="true">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-reviews" aria-labelledby="featured-title">
        <div className="section-header">
          <h2 id="featured-title" className="section-title">Dernières critiques</h2>
          <Link to="/reviews" className="btn btn-ghost">Voir tout</Link>
        </div>
        <div className="reviews-grid">
          {featuredReviews.length === 0 ? (
            <div className="empty-state">
              <p>Aucune critique pour l'instant. Soyez le premier à partager votre expérience !</p>
              <Link to="/create" className="btn btn-primary">Publier la première</Link>
            </div>
          ) : (
            featuredReviews.map(review => (
              <article key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-meta">
                    <span className="review-category">{review.category}</span>
                    <span className="review-service">{review.serviceName}</span>
                  </div>
                  <div className="review-rating" aria-label={`Note : ${review.rating} sur 5`}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`} aria-hidden="true">★</span>
                    ))}
                  </div>
                </div>
                <h3 className="review-title">{review.title}</h3>
                <p className="review-excerpt">{review.content.substring(0, 150)}...</p>
                <div className="review-footer">
                  <div className="review-author">
                    <div className="author-avatar" aria-hidden="true">
                      {review.authorAvatar ? (
                        <img src={review.authorAvatar} alt="" />
                      ) : (
                        review.authorName?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="author-info">
                      <span className="author-name">{review.authorName}</span>
                      <span className="author-location">{review.location?.address || review.location || 'Non spécifié'}</span>
                    </div>
                  </div>
                  <div className="review-votes">
                    <button className="vote-btn up" aria-label={`${review.votes.up} votes positifs`}>
                      <span>👍</span> {review.votes.up}
                    </button>
                    <button className="vote-btn down" aria-label={`${review.votes.down} votes négatifs`}>
                      <span>👎</span> {review.votes.down}
                    </button>
                  </div>
                </div>
                {review.verified && (
                  <span className="verified-badge" aria-label="Critique vérifiée avec preuves">
                    ✓ Vérifié
                  </span>
                )}
                <Link to={`/reviews/${review.id}`} className="review-link" aria-label={`Lire la critique complète : ${review.title}`}></Link>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="cta" aria-labelledby="cta-title">
        <h2 id="cta-title" className="section-title">Vous avez une expérience à partager ?</h2>
        <p className="cta-text">
          Votre témoignage peut aider des milliers de personnes à faire le bon choix 
          et pousser les entreprises à s'améliorer.
        </p>
        <Link to="/create" className="btn btn-primary btn-lg">
          <span>📝</span> Écrire ma critique maintenant
        </Link>
      </section>
    </div>
  )
}