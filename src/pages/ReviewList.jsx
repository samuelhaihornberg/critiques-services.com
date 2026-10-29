import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useReviews, CATEGORIES } from '../hooks/useReviews'
import './ReviewList.css'

export default function ReviewList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { reviews, loading } = useReviews()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date')

  const filteredReviews = useMemo(() => {
    let result = [...reviews]

    if (selectedCategory !== 'all') {
      result = result.filter(r => r.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.content.toLowerCase().includes(query) ||
        r.serviceName.toLowerCase().includes(query) ||
        r.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    switch (sortBy) {
      case 'rating-desc':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'rating-asc':
        result.sort((a, b) => a.rating - b.rating)
        break
      case 'votes':
        result.sort((a, b) => (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down))
        break
      case 'date':
      default:
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
    }

    return result
  }, [reviews, selectedCategory, searchQuery, sortBy])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (sortBy !== 'date') params.set('sort', sortBy)
    setSearchParams(params, { replace: true })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSortBy('date')
    setSearchParams({}, { replace: true })
  }

  const hasFilters = searchQuery.trim() || selectedCategory !== 'all' || sortBy !== 'date'

  if (loading) {
    return (
      <div className="review-list loading">
        <div className="filters-skeleton">
          <div className="skeleton"></div>
          <div className="skeleton"></div>
          <div className="skeleton"></div>
        </div>
        <div className="reviews-skeleton">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton review-skeleton" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="review-list">
      <header className="page-header">
        <h1>Toutes les critiques</h1>
        <p className="page-subtitle">
          {filteredReviews.length} critique{filteredReviews.length > 1 ? 's' : ''} trouvée{filteredReviews.length > 1 ? 's' : ''}
          {hasFilters && <span> (filtrées)</span>}
        </p>
      </header>

      <form className="filters-bar" onSubmit={handleSearch}>
        <div className="search-group">
          <label htmlFor="search" className="visually-hidden">Rechercher</label>
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              id="search"
              type="search"
              placeholder="Rechercher un service, un lieu, un problème..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="clear-search" aria-label="Effacer la recherche">
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="category" className="visually-hidden">Catégorie</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort" className="visually-hidden">Trier par</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date">📅 Plus récentes</option>
            <option value="rating-desc">⭐ Mieux notées</option>
            <option value="rating-asc">⭐ Moins bien notées</option>
            <option value="votes">👍 Plus votées</option>
          </select>
        </div>

        {hasFilters && (
          <button type="button" onClick={clearFilters} className="btn btn-ghost btn-sm">
            Effacer les filtres
          </button>
        )}
      </form>

      <div className="reviews-list" role="list" aria-label="Liste des critiques">
        {filteredReviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>Aucune critique trouvée</h2>
            <p>
              {hasFilters
                ? 'Essayez de modifier vos filtres ou votre recherche.'
                : 'Soyez le premier à partager votre expérience !'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn btn-primary">
                Réinitialiser les filtres
              </button>
            )}
            {!hasFilters && (
              <Link to="/create" className="btn btn-primary">
                <span>📝</span> Publier la première critique
              </Link>
            )}
          </div>
        ) : (
          filteredReviews.map(review => (
            <article key={review.id} className="review-card" role="listitem">
              <div className="review-header">
                <div className="review-meta">
                  <span className="review-category">{review.category}</span>
                  <span className="review-service">{review.serviceName}</span>
                  <span className="review-location">
                    📍 {review.location?.address || review.location || 'Non spécifié'}
                  </span>
                </div>
                <div className="review-rating" aria-label={`Note : ${review.rating} sur 5`}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`} aria-hidden="true">★</span>
                  ))}
                </div>
              </div>
              <Link to={`/reviews/${review.id}`} className="review-title-link">
                <h2 className="review-title">{review.title}</h2>
              </Link>
              <p className="review-excerpt">{review.content.substring(0, 200)}...</p>
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
                    <time className="review-date" dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </time>
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
              {review.videoUrl && (
                <span className="video-badge" aria-label="Contient une vidéo de preuve">
                  📹 Vidéo
                </span>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )
}