import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReviews, CATEGORIES, PROOF_TYPES } from '../hooks/useReviews'
import { useAuth } from '../hooks/useAuth'
import LeafletMap from '../components/LeafletMap'
import './CreateReview.css'

export default function CreateReview() {
  const navigate = useNavigate()
  const { createReview } = useReviews()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'autre',
    rating: 3,
    serviceName: '',
    serviceWebsite: '',
    location: {
      address: '',
      coords: null,
      isOnline: false
    },
    tags: '',
    experienceDate: new Date().toISOString().split('T')[0],
    // New fields
    proofs: [],
    authorComment: '',
    pricePaid: '',
    priceCurrency: 'EUR',
    priceComparison: [{ serviceName: '', price: '', currency: 'EUR', note: '' }]
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 48.8566, lng: 2.3522 })
  const [mapZoom, setMapZoom] = useState(12)
  const [searchAddress, setSearchAddress] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeProofType, setActiveProofType] = useState('image')
  const [proofFiles, setProofFiles] = useState({})
  const [proofPreviews, setProofPreviews] = useState({})

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, authLoading, navigate])

  const validateForm = useCallback(() => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Le titre est requis'
    else if (formData.title.length < 10) newErrors.title = 'Le titre doit faire au moins 10 caractères'
    if (!formData.content.trim()) newErrors.content = 'Le contenu est requis'
    else if (formData.content.length < 50) newErrors.content = 'Le contenu doit faire au moins 50 caractères'
    if (!formData.serviceName.trim()) newErrors.serviceName = 'Le nom du service est requis'
    if (!formData.experienceDate) newErrors.experienceDate = 'La date d\'expérience est requise'
    if (formData.location.isOnline && !formData.serviceWebsite.trim()) {
      newErrors.serviceWebsite = 'L\'URL du service est requise pour un service en ligne'
    } else if (formData.serviceWebsite.trim() && !isValidUrl(formData.serviceWebsite)) {
      newErrors.serviceWebsite = 'URL invalide'
    }
    if (!formData.location.isOnline && !formData.location.address.trim()) {
      newErrors.address = 'L\'adresse est requise pour un service physique'
    }
    if (formData.pricePaid && isNaN(parseFloat(formData.pricePaid))) {
      newErrors.pricePaid = 'Prix invalide'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const isValidUrl = (string) => {
    try {
      new URL(string.startsWith('http') ? string : `https://${string}`)
      return true
    } catch {
      return false
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('location.')) {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [name.split('.')[1]]: type === 'checkbox' ? checked : value }
      }))
    } else if (name.startsWith('priceComparison.')) {
      const [, index, field] = name.split('.')
      setFormData(prev => ({
        ...prev,
        priceComparison: prev.priceComparison.map((item, i) => 
          i === parseInt(index) ? { ...item, [field]: value } : item
        )
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const handleAddressSearch = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=fr`
      )
      const data = await response.json()
      setAddressSuggestions(data)
      setShowSuggestions(true)
    } catch (err) {
      console.error('Erreur recherche adresse:', err)
    }
  }, [])

  const handleAddressSelect = (place) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: place.display_name,
        coords: { lat: parseFloat(place.lat), lng: parseFloat(place.lon) }
      }
    }))
    setSearchAddress(place.display_name)
    setAddressSuggestions([])
    setShowSuggestions(false)
    setMapCenter({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) })
    setMapZoom(16)
  }

  const handleMapClick = (e) => {
    if (formData.location.isOnline) return
    const { lat, lng } = e.latlng
    setMapCenter({ lat, lng })
    reverseGeocode(lat, lng)
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      if (data.display_name) {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: data.display_name,
            coords: { lat, lng }
          }
        }))
        setSearchAddress(data.display_name)
      }
    } catch (err) {
      console.error('Erreur géocodage inverse:', err)
    }
  }

  const handleProofFile = (e, proofType) => {
    const files = Array.from(e.target.files)
    const maxSize = proofType === 'video' ? 100 * 1024 * 1024 : 20 * 1024 * 1024
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`Le fichier ${file.name} dépasse la taille max (${proofType === 'video' ? '100 Mo' : '20 Mo'})`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setProofFiles(prev => ({
      ...prev,
      [proofType]: [...(prev[proofType] || []), ...validFiles]
    }))

    validFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      setProofPreviews(prev => ({
        ...prev,
        [proofType]: [...(prev[proofType] || []), { file, url, caption: '' }]
      }))
    })
  }

  const removeProof = (proofType, index) => {
    setProofFiles(prev => {
      const next = { ...prev }
      next[proofType] = next[proofType].filter((_, i) => i !== index)
      if (next[proofType].length === 0) delete next[proofType]
      return next
    })
    setProofPreviews(prev => {
      const next = { ...prev }
      if (next[proofType][index]?.url) URL.revokeObjectURL(next[proofType][index].url)
      next[proofType] = next[proofType].filter((_, i) => i !== index)
      if (next[proofType].length === 0) delete next[proofType]
      return next
    })
  }

  const updateProofCaption = (proofType, index, caption) => {
    setProofPreviews(prev => ({
      ...prev,
      [proofType]: prev[proofType].map((item, i) => i === index ? { ...item, caption } : item)
    }))
  }

  const addPriceComparison = () => {
    setFormData(prev => ({
      ...prev,
      priceComparison: [...prev.priceComparison, { serviceName: '', price: '', currency: 'EUR', note: '' }]
    }))
  }

  const removePriceComparison = (index) => {
    if (formData.priceComparison.length <= 1) return
    setFormData(prev => ({
      ...prev,
      priceComparison: prev.priceComparison.filter((_, i) => i !== index)
    }))
  }

  const prepareProofsForSubmit = () => {
    const proofs = []
    Object.entries(proofPreviews).forEach(([type, items]) => {
      items.forEach(item => {
        proofs.push({
          type,
          url: item.url,
          caption: item.caption,
          fileName: item.file.name,
          fileSize: item.file.size,
          fileType: item.file.type
        })
      })
    })
    return proofs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const tagArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t)

      const priceComparison = formData.priceComparison
        .filter(item => item.serviceName.trim() || item.price)
        .map(item => ({
          serviceName: item.serviceName.trim(),
          price: item.price ? parseFloat(item.price) : null,
          currency: item.currency || 'EUR',
          note: item.note.trim()
        }))

      const reviewData = {
        ...formData,
        tags: tagArray,
        authorId: user.id,
        authorName: user.authorName || 'Utilisateur',
        authorAvatar: user.authorAvatar || null,
        location: {
          address: formData.location.address,
          coords: formData.location.coords,
          isOnline: formData.location.isOnline
        },
        proofs: prepareProofsForSubmit(),
        authorComment: formData.authorComment.trim(),
        pricePaid: formData.pricePaid ? parseFloat(formData.pricePaid) : null,
        priceCurrency: formData.priceCurrency,
        priceComparison
      }

      await createReview(reviewData)
      // Clean up object URLs
      Object.values(proofPreviews).flat().forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url)
      })
      navigate('/reviews')
    } catch (err) {
      console.error('Erreur création critique:', err)
      alert('Erreur lors de la publication de la critique')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="create-review loading">
        <div className="skeleton"></div>
      </div>
    )
  }

  const isOnlineCategory = ['internet', 'ecommerce', 'telecom', 'banque'].includes(formData.category)
  const isOnline = formData.location.isOnline || isOnlineCategory

  return (
    <div className="create-review">
      <header className="create-header">
        <h1>Publier une critique</h1>
        <p>Partagez votre expérience réelle avec preuves. Seules les expériences vécues personnellement sont acceptées.</p>
      </header>

      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="section-title">Informations principales</h2>
          
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Titre de la critique <span className="required">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Livraison Uber Eats - Retard de 2h sans communication"
              className={`form-input ${errors.title ? 'error' : ''}`}
              maxLength={120}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="serviceName" className="form-label">
                Nom du service <span className="required">*</span>
              </label>
              <input
                id="serviceName"
                name="serviceName"
                type="text"
                value={formData.serviceName}
                onChange={handleChange}
                placeholder="Ex: Uber Eats, Free, Amazon..."
                className={`form-input ${errors.serviceName ? 'error' : ''}`}
              />
              {errors.serviceName && <span className="error-message">{errors.serviceName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category" className="form-label">Catégorie</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="experienceDate" className="form-label">
              Date de l'expérience <span className="required">*</span>
            </label>
            <input
              id="experienceDate"
              name="experienceDate"
              type="date"
              value={formData.experienceDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={`form-input ${errors.experienceDate ? 'error' : ''}`}
            />
            {errors.experienceDate && <span className="error-message">{errors.experienceDate}</span>}
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Type de service et localisation</h2>
          
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                name="location.isOnline"
                checked={formData.location.isOnline || isOnlineCategory}
                onChange={handleChange}
                disabled={isOnlineCategory}
              />
              <span>Service purement en ligne (site web / application uniquement)</span>
            </label>
            {isOnlineCategory && (
              <p className="form-hint">Cette catégorie est automatiquement considérée comme un service en ligne.</p>
            )}
          </div>

          {isOnline ? (
            <div className="form-group">
              <label htmlFor="serviceWebsite" className="form-label">
                URL du service <span className="required">*</span>
              </label>
              <input
                id="serviceWebsite"
                name="serviceWebsite"
                type="url"
                value={formData.serviceWebsite}
                onChange={handleChange}
                placeholder="https://exemple.com"
                className={`form-input ${errors.serviceWebsite ? 'error' : ''}`}
              />
              {errors.serviceWebsite && <span className="error-message">{errors.serviceWebsite}</span>}
            </div>
          ) : (
            <div className="location-picker">
              <label htmlFor="address" className="form-label">
                Adresse du service <span className="required">*</span>
              </label>
              <div className="address-search-wrapper">
                <input
                  id="address"
                  type="text"
                  value={searchAddress || formData.location.address}
                  onChange={(e) => {
                    setSearchAddress(e.target.value)
                    handleAddressSearch(e.target.value)
                  }}
                  onFocus={() => setShowSuggestions(addressSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Rechercher une adresse (ex: 10 Rue de Rivoli, 75004 Paris)"
                  className={`form-input ${errors.address ? 'error' : ''}`}
                  autoComplete="off"
                />
                {showSuggestions && addressSuggestions.length > 0 && (
                  <ul className="address-suggestions" role="listbox">
                    {addressSuggestions.map((place, i) => (
                      <li key={i} role="option" onClick={() => handleAddressSelect(place)}>
                        {place.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {errors.address && <span className="error-message">{errors.address}</span>}

              <div className="map-container">
                <div className="map-wrapper">
                  <LeafletMap
                    center={mapCenter}
                    zoom={mapZoom}
                    markerPosition={formData.location.coords}
                    onMapClick={handleMapClick}
                    onMoveEnd={(center, zoom) => {
                      setMapCenter(center)
                      setMapZoom(zoom)
                    }}
                  />
                </div>
                <p className="map-hint">Cliquez sur la carte pour positionner le service, ou utilisez la recherche d'adresse ci-dessus.</p>
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h2 className="section-title">Votre expérience</h2>
          
          <div className="form-group">
            <label className="form-label">Note globale <span className="required">*</span></label>
            <div className="rating-input" role="radiogroup" aria-label="Note sur 5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={formData.rating === star}
                  onClick={() => handleRatingChange(star)}
                  className={`rating-star ${formData.rating >= star ? 'filled' : ''}`}
                  aria-label={`${star} sur 5 - ${RATING_LABELS[star]}`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="rating-label">{RATING_LABELS[formData.rating]}</p>
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Détails de votre expérience <span className="required">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Décrivez votre expérience en détail : ce qui s'est passé, comment le service a réagi, ce qui était bien ou mal... Soyez factuel et précis."
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              rows={8}
              minLength={50}
            />
            {errors.content && <span className="error-message">{errors.content}</span>}
            <p className="form-hint">Minimum 50 caractères. Seules les expériences réelles et vécues personnellement sont acceptées.</p>
          </div>

          <div className="form-group">
            <label htmlFor="tags" className="form-label">Mots-clés (séparés par des virgules)</label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              placeholder="ex: retard, support inexistant, pas de compensation"
              className="form-input"
            />
            <p className="form-hint">Aidez les autres à trouver votre critique (max 10 mots-clés)</p>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Preuves (images, vidéos, audio, documents)</h2>
          
          <div className="proof-types-tabs">
            {PROOF_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                className={`proof-tab ${activeProofType === type.value ? 'active' : ''}`}
                onClick={() => setActiveProofType(type.value)}
              >
                <span>{type.icon}</span> {type.label}
              </button>
            ))}
          </div>

          <div className="proof-upload-area">
            <input
              type="file"
              id={`proof-${activeProofType}`}
              accept={PROOF_TYPES.find(t => t.value === activeProofType).accept}
              multiple
              onChange={(e) => handleProofFile(e, activeProofType)}
              className="proof-file-input"
            />
            <label htmlFor={`proof-${activeProofType}`} className="proof-drop-zone">
              <span className="drop-icon">{PROOF_TYPES.find(t => t.value === activeProofType).icon}</span>
              <p>Glissez-déposez ou cliquez pour ajouter des {PROOF_TYPES.find(t => t.value === activeProofType).label.toLowerCase()}s</p>
              <span className="drop-hint">Max {activeProofType === 'video' ? '100 Mo' : '20 Mo'} par fichier</span>
            </label>
          </div>

          {proofPreviews[activeProofType]?.length > 0 && (
            <div className="proof-previews">
              {proofPreviews[activeProofType].map((item, index) => (
                <div key={index} className="proof-preview-item">
                  {item.file.type.startsWith('image/') && (
                    <img src={item.url} alt={item.caption || `Preuve ${index + 1}`} />
                  )}
                  {item.file.type.startsWith('video/') && (
                    <video src={item.url} controls preload="metadata" />
                  )}
                  {item.file.type.startsWith('audio/') && (
                    <audio src={item.url} controls preload="metadata" />
                  )}
                  {item.file.type === 'application/pdf' && (
                    <div className="document-preview">
                      <span>📄</span> {item.file.name}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Légende (optionnel)"
                    value={item.caption}
                    onChange={(e) => updateProofCaption(activeProofType, index, e.target.value)}
                    className="proof-caption-input"
                  />
                  <button
                    type="button"
                    className="proof-remove-btn"
                    onClick={() => removeProof(activeProofType, index)}
                    aria-label="Supprimer cette preuve"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="form-hint">Ajoutez photos, vidéos, enregistrements audio ou documents pour étayer votre critique.</p>
        </div>

        <div className="form-section">
          <h2 className="section-title">Commentaire de l'auteur (optionnel)</h2>
          <div className="form-group">
            <label htmlFor="authorComment" className="form-label">Votre commentaire / analyse</label>
            <textarea
              id="authorComment"
              name="authorComment"
              value={formData.authorComment}
              onChange={handleChange}
              placeholder="En tant qu'auteur, ajoutez votre analyse, votre conclusion, ou tout contexte supplémentaire..."
              className="form-textarea"
              rows={4}
            />
            <p className="form-hint">Ce commentaire sera affiché distinctement comme « Commentaire de l'auteur »</p>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Prix payé et comparatif</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pricePaid" className="form-label">Prix payé</label>
              <div className="price-input-wrapper">
                <input
                  id="pricePaid"
                  name="pricePaid"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pricePaid}
                  onChange={handleChange}
                  placeholder="Ex: 29.99"
                  className={`form-input ${errors.pricePaid ? 'error' : ''}`}
                />
                <select name="priceCurrency" value={formData.priceCurrency} onChange={handleChange} className="currency-select">
                  <option value="EUR">€ EUR</option>
                  <option value="USD">$ USD</option>
                  <option value="GBP">£ GBP</option>
                  <option value="CAD">$ CAD</option>
                </select>
              </div>
              {errors.pricePaid && <span className="error-message">{errors.pricePaid}</span>}
              <p className="form-hint">Le prix réel que vous avez payé pour ce service</p>
            </div>

            <div className="form-group">
              <label className="form-label">Comparatif avec services similaires</label>
              <div className="price-comparison-list">
                {formData.priceComparison.map((item, index) => (
                  <div key={index} className="price-comparison-item">
                    <div className="comparison-fields">
                      <input
                        name={`priceComparison.${index}.serviceName`}
                        type="text"
                        value={item.serviceName}
                        onChange={handleChange}
                        placeholder="Nom du service concurrent"
                        className="form-input"
                      />
                      <div className="price-input-wrapper small">
                        <input
                          name={`priceComparison.${index}.price`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={handleChange}
                          placeholder="Prix"
                          className="form-input"
                        />
                        <select
                          name={`priceComparison.${index}.currency`}
                          value={item.currency}
                          onChange={handleChange}
                          className="currency-select"
                        >
                          <option value="EUR">€</option>
                          <option value="USD">$</option>
                          <option value="GBP">£</option>
                        </select>
                      </div>
                    </div>
                    <input
                      name={`priceComparison.${index}.note`}
                      type="text"
                      value={item.note}
                      onChange={handleChange}
                      placeholder="Note (ex: sans engagement, livraison incluse...)"
                      className="form-input"
                    />
                    {formData.priceComparison.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm remove-comparison"
                        onClick={() => removePriceComparison(index)}
                        aria-label="Retirer ce comparatif"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addPriceComparison}>
                ➕ Ajouter un service pour comparer
              </button>
              <p className="form-hint">Aidez les lecteurs à comparer les prix avec la concurrence</p>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Publication...' : 'Publier ma critique'}
          </button>
        </div>
      </form>
    </div>
  )
}

const RATING_LABELS = {
  1: 'Catastrophique - À fuir absolument',
  2: 'Mauvais - Décevant',
  3: 'Moyen - Correct sans plus',
  4: 'Bon - Recommandable',
  5: 'Excellent - Au top'
}