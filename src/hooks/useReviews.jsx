import { openDB } from 'idb'
import { useState, useEffect, useCallback } from 'react'

const DB_NAME = 'critiques-services'
const DB_VERSION = 3
const STORE_REVIEWS = 'reviews'
const STORE_COMMENTS = 'comments'
const STORE_REACTIONS = 'reactions'

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
      if (!db.objectStoreNames.contains(STORE_REACTIONS)) {
        const reactionStore = db.createObjectStore(STORE_REACTIONS, { keyPath: 'id' })
        reactionStore.createIndex('by-review', 'reviewId')
        reactionStore.createIndex('by-author', 'authorId')
        reactionStore.createIndex('by-date', 'createdAt')
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE_COMMENTS)) {
          const commentStore = db.createObjectStore(STORE_COMMENTS, { keyPath: 'id' })
          commentStore.createIndex('by-review', 'reviewId')
          commentStore.createIndex('by-author', 'authorId')
          commentStore.createIndex('by-date', 'createdAt')
        }
      }
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains(STORE_REACTIONS)) {
          const reactionStore = db.createObjectStore(STORE_REACTIONS, { keyPath: 'id' })
          reactionStore.createIndex('by-review', 'reviewId')
          reactionStore.createIndex('by-author', 'authorId')
          reactionStore.createIndex('by-date', 'createdAt')
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
    authorComment: 'En tant qu\'admin, je confirme : ce service se dégrade mois après mois. J\'ai personnellement testé 5 fois en 2 mois, 4 échecs.',
    proofs: [
      { type: 'video', url: 'https://example.com/proof1.mp4', thumbnail: null, caption: 'Attente devant la porte 2h' },
      { type: 'image', url: 'https://example.com/chat-support.jpg', caption: 'Support injoignable' },
      { type: 'audio', url: 'https://example.com/call-recording.mp3', caption: 'Appel livreur sans réponse' }
    ],
    pricePaid: 35.50,
    priceCurrency: 'EUR',
    priceComparison: [
      { serviceName: 'Deliveroo', price: 38.00, currency: 'EUR', note: 'Plus cher mais livré à l\'heure' },
      { serviceName: 'Just Eat', price: 32.00, currency: 'EUR', note: 'Moins cher, même problème' }
    ],
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
    experienceDate: '2024-01-15',
    reactions: { '👍': 12, '👎': 3, '😡': 8, '😢': 5, '🚩': 15 }
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
    authorComment: 'Excellent service, rare de nos jours. Je recommande sans hésiter.',
    proofs: [
      { type: 'image', url: 'https://example.com/tech-install.jpg', caption: 'Installation propre' },
      { type: 'image', url: 'https://example.com/speed-test.png', caption: 'Test débit 1Gbps' }
    ],
    pricePaid: 29.99,
    priceCurrency: 'EUR',
    priceComparison: [
      { serviceName: 'Orange', price: 42.99, currency: 'EUR', note: 'Plus cher, engagement 12 mois' },
      { serviceName: 'SFR', price: 35.99, currency: 'EUR', note: 'Service client médiocre' }
    ],
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
    experienceDate: '2024-01-14',
    reactions: { '👍': 45, '❤️': 23, '🎉': 12, '💪': 8, '🤝': 15 }
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
    authorComment: 'Inadmissible pour un leader mondial. Procédure de remboursement inexistante.',
    proofs: [
      { type: 'image', url: 'https://example.com/empty-mailbox.jpg', caption: 'Boîte aux lettres vide' },
      { type: 'video', url: 'https://example.com/amazon-chat.mp4', thumbnail: null, caption: 'Chat support refus remboursement' }
    ],
    pricePaid: 80.00,
    priceCurrency: 'EUR',
    priceComparison: [
      { serviceName: 'Cdiscount', price: 75.00, currency: 'EUR', note: 'Livraison point relais sécurisée' },
      { serviceName: 'Fnac', price: 82.00, currency: 'EUR', note: 'Plus cher mais suivi colis fiable' }
    ],
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
    experienceDate: '2024-01-13',
    reactions: { '👎': 22, '😡': 31, '😢': 18, '🚩': 42, '🤔': 7 }
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
    authorComment: 'Pratiques commerciales trompeuses. Signalé à la DGCCRF.',
    proofs: [
      { type: 'image', url: 'https://example.com/bills.jpg', caption: 'Prélèvements continus' },
      { type: 'audio', url: 'https://example.com/call-center.mp3', caption: 'Enregistrement service client' },
      { type: 'image', url: 'https://example.com/avenant.pdf', caption: 'Avenant non signé reçu' }
    ],
    pricePaid: 45.99,
    priceCurrency: 'EUR',
    priceComparison: [
      { serviceName: 'Free', price: 19.99, currency: 'EUR', note: 'Sans engagement, résiliation simple' },
      { serviceName: 'Sosh', price: 24.99, currency: 'EUR', note: 'Réseau Orange, sans engagement' }
    ],
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
    experienceDate: '2024-01-12',
    reactions: { '👎': 35, '😡': 48, '🚩': 62, '😢': 12 }
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
    authorComment: 'Un médecin comme on n\'en fait plus. Merci Dr. Martin.',
    proofs: [
      { type: 'image', url: 'https://example.com/prescription.jpg', caption: 'Ordonnance détaillée' }
    ],
    pricePaid: 25.00,
    priceCurrency: 'EUR',
    priceComparison: [
      { serviceName: 'Autre cabinet', price: 30.00, currency: 'EUR', note: 'Consultation 10 min, pas de suivi' }
    ],
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
    experienceDate: '2024-01-11',
    reactions: { '👍': 89, '❤️': 67, '🎉': 23, '💪': 15, '🤝': 34 }
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
    parentId: null,
    reactions: { '👍': 5, '🤝': 3 }
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
    parentId: null,
    reactions: { '👍': 4, '💪': 2 }
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
    parentId: null,
    reactions: { '👍': 12, '❤️': 5, '🎉': 3 }
  }
]

const MOCK_REACTIONS = [
  { id: 'r1', reviewId: '1', authorId: 'u10', authorName: 'Paul', authorAvatar: null, emoji: '🚩', createdAt: '2024-01-15T20:35:00Z' },
  { id: 'r2', reviewId: '1', authorId: 'u11', authorName: 'Lisa', authorAvatar: null, emoji: '😡', createdAt: '2024-01-15T20:40:00Z' },
  { id: 'r3', reviewId: '1', authorId: 'u12', authorName: 'Tom', authorAvatar: null, emoji: '😢', createdAt: '2024-01-15T20:45:00Z' },
  { id: 'r4', reviewId: '2', authorId: 'u13', authorName: 'Anna', authorAvatar: null, emoji: '❤️', createdAt: '2024-01-14T10:20:00Z' },
  { id: 'r5', reviewId: '2', authorId: 'u14', authorName: 'Mike', authorAvatar: null, emoji: '🎉', createdAt: '2024-01-14T10:25:00Z' },
  { id: 'r6', reviewId: '2', authorId: 'u15', authorName: 'Sarah', authorAvatar: null, emoji: '💪', createdAt: '2024-01-14T10:30:00Z' },
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
        for (const reaction of MOCK_REACTIONS) {
          await db.put(STORE_REACTIONS, reaction)
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
      verified: false,
      proofs: reviewData.proofs || [],
      authorComment: reviewData.authorComment || '',
      pricePaid: reviewData.pricePaid || null,
      priceCurrency: reviewData.priceCurrency || 'EUR',
      priceComparison: reviewData.priceComparison || [],
      reactions: {}
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
    const comments = await db.getAllFromIndex(STORE_COMMENTS, 'by-review', id)
    for (const comment of comments) {
      await db.delete(STORE_COMMENTS, comment.id)
    }
    const reactions = await db.getAllFromIndex(STORE_REACTIONS, 'by-review', id)
    for (const reaction of reactions) {
      await db.delete(STORE_REACTIONS, reaction.id)
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
      parentId,
      reactions: {}
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

  // Reactions functions
  const getReactions = useCallback(async (reviewId) => {
    const db = await getDB()
    return db.getAllFromIndex(STORE_REACTIONS, 'by-review', reviewId)
  }, [])

  const addReaction = useCallback(async (reviewId, authorId, authorName, authorAvatar, emoji) => {
    const db = await getDB()
    const newReaction = {
      id: `r${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      reviewId,
      authorId,
      authorName,
      authorAvatar,
      emoji,
      createdAt: new Date().toISOString()
    }
    await db.put(STORE_REACTIONS, newReaction)
    
    // Update review reactions count
    const review = await db.get(STORE_REVIEWS, reviewId)
    if (review) {
      const reactions = { ...review.reactions }
      reactions[emoji] = (reactions[emoji] || 0) + 1
      await db.put(STORE_REVIEWS, { ...review, reactions })
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reactions } : r))
    }
    return newReaction
  }, [])

  const removeReaction = useCallback(async (reviewId, authorId, emoji) => {
    const db = await getDB()
    const reactions = await db.getAllFromIndex(STORE_REACTIONS, 'by-review', reviewId)
    const userReaction = reactions.find(r => r.authorId === authorId && r.emoji === emoji)
    if (userReaction) {
      await db.delete(STORE_REACTIONS, userReaction.id)
      
      const review = await db.get(STORE_REVIEWS, reviewId)
      if (review && review.reactions[emoji]) {
        const updatedReactions = { ...review.reactions }
        updatedReactions[emoji] = Math.max(0, updatedReactions[emoji] - 1)
        if (updatedReactions[emoji] === 0) delete updatedReactions[emoji]
        await db.put(STORE_REVIEWS, { ...review, reactions: updatedReactions })
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reactions: updatedReactions } : r))
      }
    }
  }, [])

  const hasUserReacted = useCallback(async (reviewId, authorId, emoji) => {
    const db = await getDB()
    const reactions = await db.getAllFromIndex(STORE_REACTIONS, 'by-review', reviewId)
    return reactions.some(r => r.authorId === authorId && r.emoji === emoji)
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
    deleteComment,
    // Reactions
    getReactions,
    addReaction,
    removeReaction,
    hasUserReacted
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

export const EMOJI_REACTIONS = ['👍', '👎', '❤️', '😂', '😮', '😡', '😢', '🎉', '🤔', '💪', '🤝', '🚩']

export const PROOF_TYPES = [
  { value: 'image', label: 'Image', accept: 'image/*', icon: '🖼️' },
  { value: 'video', label: 'Vidéo', accept: 'video/*', icon: '🎥' },
  { value: 'audio', label: 'Audio', accept: 'audio/*', icon: '🎵' },
  { value: 'document', label: 'Document', accept: '.pdf,.doc,.docx', icon: '📄' }
]