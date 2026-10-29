import { openDB } from 'idb'
import { useState, useEffect, useCallback } from 'react'

const DB_NAME = 'critiques-services'
const DB_VERSION = 2
const STORE_REVIEWS = 'reviews'
const STORE_COMMENTS = 'comments'

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_REVIEWS)) {
        const store = db.createObjectStore(STORE_REVIEWS, { keyPath: 'id' })
        store.createIndex('by-date', 'createdAt')
        store.createIndex('by-category', 'category')
        store.createIndex('by-author', 'authorId')
        store.createIndex('by-location', 'location.coords')
      }
      if (!db.objectStoreNames.contains(STORE_COMMENTS)) {
        const commentStore = db.createObjectStore(STORE_COMMENTS, { keyPath: 'id' })
        commentStore.createIndex('by-review', 'reviewId')
        commentStore.createIndex('by-author', 'authorId')
        commentStore.createIndex('by-date', 'createdAt')
      }
      if (oldVersion < 2) {
        // Migration v1 -> v2: add location and comments stores
        if (!db.objectStoreNames.contains(STORE_COMMENTS)) {
          const commentStore = db.createObjectStore(STORE_COMMENTS, { keyPath: 'id' })
          commentStore.createIndex('by-review', 'reviewId')
          commentStore.createIndex('by-author', 'authorId')
          commentStore.createIndex('by-date', 'createdAt')
        }
      }
    }
  })
}

const MOCK_REVIEWS = [
  {
    id: '1',
    title: 'Livraison Uber Eats - Retard de 2h sans communication',
    content: 'Commande passée à 19h30, livrée à 21h45. Le livreur ne répondait pas aux appels, le support Uber Eats injoignable. Aucune compensation proposée.',
    category: 'livraison',
    rating: 1,
    authorId: 'user1',
    authorName: 'Marie D.',
    authorAvatar: null,
    videoUrl: null,
    videoThumbnail: null,
    location: {
      address: 'Paris 11e, France',
      coords: { lat: 48.8566, lng: 2.3522 },
      isOnline: false
    },
    serviceName: 'Uber Eats',
    serviceWebsite: 'https://ubereats.com',
    tags: ['retard', 'support inexistant', 'pas de compensation'],
    createdAt: '2024-01-15T20:30:00Z',
    updatedAt: '2024-01-15T20:30:00Z',
    votes: { up: 47, down: 3 },
    verified: true,
    experienceDate: '2024-01-15'
  },
  {
    id: '2',
    title: 'Freebox - Technicien au top, installation parfaite',
    content: 'Le technicien est arrivé à l\'heure, a tout expliqué clairement, a testé la connexion et m\'a montré comment utiliser l\'interface. Très pro et sympathique.',
    category: 'internet',
    rating: 5,
    authorId: 'user2',
    authorName: 'Thomas L.',
    authorAvatar: null,
    videoUrl: null,
    videoThumbnail: null,
    location: {
      address: 'Lyon 3e, France',
      coords: { lat: 45.7640, lng: 4.8357 },
      isOnline: true
    },
    serviceName: 'Free',
    serviceWebsite: 'https://free.fr',
    tags: ['ponctuel', 'explications claires', 'test complet'],
    createdAt: '2024-01-14T10:15:00Z',
    updatedAt: '2024-01-14T10:15:00Z',
    votes: { up: 123, down: 1 },
    verified: true,
    experienceDate: '2024-01-14'
  },
  {
    id: '3',
    title: 'Amazon - Colis "livré" mais jamais reçu',
    content: 'Statut "livré dans la boîte aux lettres" mais boîte vide. Voisin n\'a rien vu. Service client Amazon : "on ne peut rien faire, c\'est livré". 80€ perdus.',
    category: 'ecommerce',
    rating: 1,
    authorId: 'user3',
    authorName: 'Sarah K.',
    authorAvatar: null,
    videoUrl: null,
    videoThumbnail: null,
    location: {
      address: 'Marseille 6e, France',
      coords: { lat: 43.2965, lng: 5.3698 },
      isOnline: true
    },
    serviceName: 'Amazon',
    serviceWebsite: 'https://amazon.fr',
    tags: ['colis perdu', 'service client inutile', 'remboursement refusé'],
    createdAt: '2024-01-13T14:22:00Z',
    updatedAt: '2024-01-13T14:22:00Z',
    votes: { up: 89, down: 5 },
    verified: true,
    experienceDate: '2024-01-13'
  },
  {
    id: '4',
    title: 'Bouygues Telecom - Résiliation impossible',
    content: 'J\'essaie de résilier depuis 3 mois. On me renvoie d\'un service à l\'autre, on me fait signer des avenants que je n\'ai jamais demandés. Prélèvements continus.',
    category: 'telecom',
    rating: 1,
    authorId: 'user4',
    authorName: 'Pierre M.',
    authorAvatar: null,
    videoUrl: null,
    videoThumbnail: null,
    location: {
      address: 'Toulouse, France',
      coords: { lat: 43.6047, lng: 1.4442 },
      isOnline: true
    },
    serviceName: 'Bouygues Telecom',
    serviceWebsite: 'https://bouyguestelecom.fr',
    tags: ['resiliation impossible', 'prelevements abusifs', 'service client faché'],
    createdAt: '2024-01-12T09:45:00Z',
    updatedAt: '2024-01-12T09:45:00Z',
    votes: { up: 156, down: 8 },
    verified: true,
    experienceDate: '2024-01-12'
  },
  {
    id: '5',
    title: 'Médecin traitant - Écoute et humanité rare',
    content: 'Le Dr. Martin a pris 45 min pour ma consultation (prévue 15 min). A tout expliqué, m\'a orienté vers le bon spécialiste, m\'a appelé 3 jours après pour des nouvelles.',
    category: 'sante',
    rating: 5,
    authorId: 'user5',
    authorName: 'Julie R.',
    authorAvatar: null,
    videoUrl: null,
    videoThumbnail: null,
    location: {
      address: 'Bordeaux, France',
      coords: { lat: 44.8378, lng: -0.5792 },
      isOnline: false
    },
    serviceName: 'Cabinet médical Dr. Martin',
    serviceWebsite: null,
    tags: ['ecoute', 'humanite', 'suivi post-consultation'],
    createdAt: '2024-01-11T16:30:00Z',
    updatedAt: '2024-01-11T16:30:00Z',
    votes: { up: 234, down: 0 },
    verified: true,
    experienceDate: '2024-01-11'
  }
]

const MOCK_COMMENTS = [
  {
    id: 'c1',
    reviewId: '1',
    authorId: 'user6',
    authorName: 'Alex T.',
    authorAvatar: null,
    content: 'Même expérience pour moi la semaine dernière. Livreurs fantômes, support qui répond par bot. J\'ai fini par me faire rembourser via ma banque.',
    createdAt: '2024-01-15T21:00:00Z',
    updatedAt: '2024-01-15T21:00:00Z',
    votes: { up: 12, down: 0 },
    parentId: null
  },
  {
    id: 'c2',
    reviewId: '1',
    authorId: 'user7',
    authorName: 'Sophie M.',
    authorAvatar: null,
    content: 'Ça arrive trop souvent. J\'ai switché sur Deliveroo, un peu plus cher mais au moins ils livrent.',
    createdAt: '2024-01-15T22:30:00Z',
    updatedAt: '2024-01-15T22:30:00Z',
    votes: { up: 8, down: 1 },
    parentId: null
  },
  {
    id: 'c3',
    reviewId: '2',
    authorId: 'user8',
    authorName: 'Marc D.',
    authorAvatar: null,
    content: 'Pareil pour moi ! Le technicien Free était super pro. Ça change des autres FAI.',
    createdAt: '2024-01-14T11:00:00Z',
    updatedAt: '2024-01-14T11:00:00Z',
    votes: { up: 25, down: 0 },
    parentId: null
  }
]

export function useReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = useCallback(async () => {
    try {
      const db = await getDB()
      const stored = await db.getAll(STORE_REVIEWS)
      if (stored.length > 0) {
        setReviews(stored.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      } else {
        for (const review of MOCK_REVIEWS) {
          await db.put(STORE_REVIEWS, review)
        }
        for (const comment of MOCK_COMMENTS) {
          await db.put(STORE_COMMENTS, comment)
        }
        setReviews(MOCK_REVIEWS.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      }
    } catch (err) {
      console.error('Erreur chargement reviews:', err)
      setReviews(MOCK_REVIEWS.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createReview = useCallback(async (reviewData) => {
    const db = await getDB()
    const newReview = {
      ...reviewData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      votes: { up: 0, down: 0 },
      verified: false
    }
    await db.put(STORE_REVIEWS, newReview)
    setReviews(prev => [newReview, ...prev])
    return newReview
  }, [])

  const updateReview = useCallback(async (id, updates) => {
    const db = await getDB()
    const existing = await db.get(STORE_REVIEWS, id)
    if (!existing) return null
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    await db.put(STORE_REVIEWS, updated)
    setReviews(prev => prev.map(r => r.id === id ? updated : r))
    return updated
  }, [])

  const deleteReview = useCallback(async (id) => {
    const db = await getDB()
    await db.delete(STORE_REVIEWS, id)
    // Also delete associated comments
    const comments = await db.getAllFromIndex(STORE_COMMENTS, 'by-review', id)
    for (const comment of comments) {
      await db.delete(STORE_COMMENTS, comment.id)
    }
    setReviews(prev => prev.filter(r => r.id !== id))
  }, [])

  const voteReview = useCallback(async (id, type) => {
    const db = await getDB()
    const existing = await db.get(STORE_REVIEWS, id)
    if (!existing) return
    const updated = {
      ...existing,
      votes: {
        ...existing.votes,
        [type]: existing.votes[type] + 1
      }
    }
    await db.put(STORE_REVIEWS, updated)
    setReviews(prev => prev.map(r => r.id === id ? updated : r))
  }, [])

  const getReview = useCallback(async (id) => {
    const db = await getDB()
    return db.get(STORE_REVIEWS, id)
  }, [])

  const getReviewsByCategory = useCallback((category) => {
    if (category === 'all') return reviews
    return reviews.filter(r => r.category === category)
  }, [reviews])

  const getReviewsByAuthor = useCallback((authorId) => {
    return reviews.filter(r => r.authorId === authorId)
  }, [reviews])

  // Comments functions
  const getComments = useCallback(async (reviewId) => {
    const db = await getDB()
    return db.getAllFromIndex(STORE_COMMENTS, 'by-review', reviewId)
  }, [])

  const createComment = useCallback(async (reviewId, authorId, authorName, authorAvatar, content, parentId = null) => {
    const db = await getDB()
    const newComment = {
      id: `c${Date.now()}`,
      reviewId,
      authorId,
      authorName,
      authorAvatar,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      votes: { up: 0, down: 0 },
      parentId
    }
    await db.put(STORE_COMMENTS, newComment)
    return newComment
  }, [])

  const voteComment = useCallback(async (commentId, type) => {
    const db = await getDB()
    const existing = await db.get(STORE_COMMENTS, commentId)
    if (!existing) return
    const updated = {
      ...existing,
      votes: {
        ...existing.votes,
        [type]: existing.votes[type] + 1
      }
    }
    await db.put(STORE_COMMENTS, updated)
    // Note: comments are not in global state, they're fetched per review
    return updated
  }, [])

  const updateComment = useCallback(async (commentId, updates) => {
    const db = await getDB()
    const existing = await db.get(STORE_COMMENTS, commentId)
    if (!existing) return null
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    await db.put(STORE_COMMENTS, updated)
    return updated
  }, [])

  const deleteComment = useCallback(async (commentId) => {
    const db = await getDB()
    await db.delete(STORE_COMMENTS, commentId)
  }, [])

  return {
    reviews,
    loading,
    error,
    createReview,
    updateReview,
    deleteReview,
    voteReview,
    getReview,
    getReviewsByCategory,
    getReviewsByAuthor,
    refresh: loadReviews,
    // Comments
    getComments,
    createComment,
    voteComment,
    updateComment,
    deleteComment
  }
}

export const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: '📋' },
  { id: 'livraison', label: 'Livraison', icon: '🚚' },
  { id: 'internet', label: 'Internet / Télécom', icon: '🌐' },
  { id: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { id: 'telecom', label: 'Téléphone / Forfait', icon: '📱' },
  { id: 'sante', label: 'Santé / Médical', icon: '🏥' },
  { id: 'banque', label: 'Banque / Assurance', icon: '🏦' },
  { id: 'transport', label: 'Transport', icon: '🚌' },
  { id: 'restauration', label: 'Restauration', icon: '🍽️' },
  { id: 'services', label: 'Services à domicile', icon: '🔧' },
  { id: 'administration', label: 'Administration', icon: '🏛️' },
  { id: 'autre', label: 'Autre', icon: '📦' }
]

export const RATING_LABELS = {
  1: 'Catastrophique',
  2: 'Mauvais',
  3: 'Moyen',
  4: 'Bon',
  5: 'Excellent'
}

export const ONLINE_CATEGORIES = ['internet', 'ecommerce', 'telecom', 'banque']