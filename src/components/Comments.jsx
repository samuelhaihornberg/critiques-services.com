import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { EMOJI_REACTIONS } from '../hooks/useReviews'
import './Comments.css'

export default function Comments({ 
  reviewId, 
  initialComments = [], 
  onLoadComments, 
  createComment, 
  voteComment,
  addReaction,
  removeReaction,
  hasUserReacted
}) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState(initialComments)
  const [loading, setLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState(new Set())
  const [userCommentReactions, setUserCommentReactions] = useState({})

  useEffect(() => {
    if (onLoadComments && initialComments.length === 0) {
      loadComments()
    } else if (initialComments.length > 0) {
      setComments(initialComments)
    }
  }, [reviewId, initialComments, onLoadComments])

  const loadComments = async () => {
    setLoading(true)
    try {
      const loaded = await onLoadComments(reviewId)
      setComments(loaded || [])
      // Check user reactions on comments
      if (user && loaded) {
        const reactions = {}
        for (const comment of loaded) {
          if (comment.reactions) {
            for (const emoji of Object.keys(comment.reactions)) {
              const key = `${comment.id}:${emoji}`
              const hasReacted = await hasUserReacted(reviewId, user.id, emoji)
              reactions[key] = hasReacted
            }
          }
        }
        setUserCommentReactions(reactions)
      }
    } catch (err) {
      console.error('Erreur chargement commentaires:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('Connectez-vous pour commenter')
      return
    }
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const comment = await createComment(
        reviewId,
        user.id,
        user.authorName || 'Utilisateur',
        user.authorAvatar || null,
        newComment.trim()
      )
      setComments(prev => [comment, ...prev])
      setNewComment('')
    } catch (err) {
      console.error('Erreur création commentaire:', err)
      alert('Erreur lors de la publication')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId) => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour répondre')
      return
    }
    if (!replyContent.trim()) return

    setSubmitting(true)
    try {
      const comment = await createComment(
        reviewId,
        user.id,
        user.authorName || 'Utilisateur',
        user.authorAvatar || null,
        replyContent.trim(),
        parentId
      )
      setComments(prev => [comment, ...prev])
      setReplyingTo(null)
      setReplyContent('')
    } catch (err) {
      console.error('Erreur création réponse:', err)
      alert('Erreur lors de la publication')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (commentId, type) => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour voter')
      return
    }
    try {
      await voteComment(commentId, type)
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, votes: { ...c.votes, [type]: c.votes[type] + 1 } }
          : c
      ))
    } catch (err) {
      console.error('Erreur vote:', err)
    }
  }

  const handleCommentReaction = async (commentId, emoji) => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour réagir')
      return
    }
    const key = `${commentId}:${emoji}`
    const hasReacted = userCommentReactions[key]
    if (hasReacted) {
      await removeReaction(reviewId, user.id, emoji)
      setUserCommentReactions(prev => ({ ...prev, [key]: false }))
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c
        const reactions = { ...c.reactions }
        reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1)
        if (reactions[emoji] === 0) delete reactions[emoji]
        return { ...c, reactions }
      }))
    } else {
      await addReaction(reviewId, user.id, user.authorName || 'Utilisateur', user.authorAvatar || null, emoji)
      setUserCommentReactions(prev => ({ ...prev, [key]: true }))
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c
        const reactions = { ...c.reactions }
        reactions[emoji] = (reactions[emoji] || 0) + 1
        return { ...c, reactions }
      }))
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getReplies = (parentId) => {
    return comments.filter(c => c.parentId === parentId)
  }

  const getTopLevelComments = () => {
    return comments.filter(c => !c.parentId)
  }

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  const netVotes = (comment) => comment.votes.up - comment.votes.down

  return (
    <section className="comments-section" aria-labelledby="comments-title">
      <h2 id="comments-title" className="comments-title">
        Discussions ({comments.length})
      </h2>

      {isAuthenticated ? (
        <form className="comment-form" onSubmit={handleSubmitComment}>
          <div className="comment-form-header">
            <div className="author-avatar" aria-hidden="true">
              {user.authorAvatar ? (
                <img src={user.authorAvatar} alt="" />
              ) : (
                user.authorName?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Partagez votre expérience ou votre avis..."
              className="comment-input"
              rows={3}
              aria-label="Votre commentaire"
            />
          </div>
          <div className="comment-form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <p>Connectez-vous pour participer à la discussion</p>
          <a href="/login" className="btn btn-primary btn-sm">Se connecter</a>
        </div>
      )}

      <div className="comments-list" role="list" aria-label="Liste des commentaires">
        {loading ? (
          <div className="comments-loading">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton comment-skeleton"></div>
            ))}
          </div>
        ) : getTopLevelComments().length === 0 ? (
          <div className="comments-empty">
            <p>Aucun commentaire pour l'instant. Soyez le premier à réagir !</p>
          </div>
        ) : (
          getTopLevelComments().map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              expanded={expandedReplies.has(comment.id)}
              onToggleReplies={() => toggleReplies(comment.id)}
              onReply={setReplyingTo}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={handleSubmitReply}
              onVote={handleVote}
              onReaction={handleCommentReaction}
              currentUserId={user?.id}
              formatDate={formatDate}
              netVotes={netVotes(comment)}
              userReactions={userCommentReactions}
            />
          ))
        )}
      </div>
    </section>
  )
}

function CommentThread({ 
  comment, 
  replies, 
  expanded, 
  onToggleReplies, 
  onReply, 
  replyingTo, 
  replyContent, 
  setReplyContent, 
  onSubmitReply, 
  onVote, 
  onReaction,
  currentUserId, 
  formatDate, 
  netVotes,
  userReactions
}) {
  const isAuthor = currentUserId && comment.authorId === currentUserId
  const showReplyForm = replyingTo === comment.id

  return (
    <article className="comment-thread" role="listitem">
      <CommentItem
        comment={comment}
        isAuthor={isAuthor}
        onVote={onVote}
        onReply={onReply}
        onReaction={onReaction}
        formatDate={formatDate}
        netVotes={netVotes}
        currentUserId={currentUserId}
        userReactions={userReactions}
      />

      {replies.length > 0 && (
        <div className="comment-replies">
          <button 
            className="replies-toggle"
            onClick={onToggleReplies}
            aria-expanded={expanded}
          >
            {expanded ? 'Masquer' : `Voir les ${replies.length} réponse${replies.length > 1 ? 's' : ''}`}
          </button>
          
          {expanded && (
            <div className="replies-list" role="list">
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isAuthor={currentUserId && reply.authorId === currentUserId}
                  onVote={onVote}
                  onReply={onReply}
                  onReaction={onReaction}
                  formatDate={formatDate}
                  netVotes={netVotes(reply)}
                  currentUserId={currentUserId}
                  userReactions={userReactions}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showReplyForm && (
        <form className="reply-form" onSubmit={(e) => { e.preventDefault(); onSubmitReply(comment.id); }}>
          <div className="reply-form-header">
            <div className="author-avatar" aria-hidden="true">
              {replyContent && 'U'}
            </div>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Répondre à ${comment.authorName}...`}
              className="reply-input"
              rows={2}
              autoFocus
            />
          </div>
          <div className="reply-form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onReply(null)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!replyContent.trim()}>
              Répondre
            </button>
          </div>
        </form>
      )}
    </article>
  )
}

function CommentItem({ comment, isAuthor, onVote, onReply, onReaction, formatDate, netVotes, currentUserId, userReactions, isReply }) {
  const reactions = comment.reactions || {}

  return (
    <div className={`comment-item ${isReply ? 'reply' : ''}`}>
      <div className="comment-main">
        <div className="comment-votes">
          <button
            className={`vote-btn ${netVotes > 0 ? 'voted-up' : ''}`}
            onClick={() => onVote(comment.id, 'up')}
            disabled={!currentUserId}
            aria-label={`${comment.votes.up} votes pour`}
            aria-pressed={netVotes > 0}
          >
            <span>👍</span>
            <span className="vote-count">{comment.votes.up}</span>
          </button>
          <button
            className={`vote-btn ${netVotes < 0 ? 'voted-down' : ''}`}
            onClick={() => onVote(comment.id, 'down')}
            disabled={!currentUserId}
            aria-label={`${comment.votes.down} votes contre`}
            aria-pressed={netVotes < 0}
          >
            <span>👎</span>
            <span className="vote-count">{comment.votes.down}</span>
          </button>
        </div>

        <div className="comment-content">
          <header className="comment-header">
            <div className="author-info">
              <div className="author-avatar" aria-hidden="true">
                {comment.authorAvatar ? (
                  <img src={comment.authorAvatar} alt="" />
                ) : (
                  comment.authorName?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div className="author-details">
                <span className="author-name">{comment.authorName}</span>
                <time className="comment-date" dateTime={comment.createdAt}>
                  {formatDate(comment.createdAt)}
                </time>
              </div>
            </div>
            {isAuthor && (
              <div className="comment-actions">
                <button className="btn btn-ghost btn-xs" onClick={() => { /* edit */ }}>
                  Modifier
                </button>
                <button className="btn btn-danger btn-xs" onClick={() => { /* delete */ }}>
                  Supprimer
                </button>
              </div>
            )}
          </header>

          <p className="comment-text">{comment.content}</p>

          {/* Comment Reactions */}
          {Object.keys(reactions).length > 0 && (
            <div className="comment-reactions">
              {EMOJI_REACTIONS.map(emoji => {
                const count = reactions[emoji] || 0
                const key = `${comment.id}:${emoji}`
                const hasReacted = userReactions[key]
                return (
                  <button
                    key={emoji}
                    className={`reaction-btn small ${hasReacted ? 'reacted' : ''} ${count > 0 ? 'has-count' : ''}`}
                    onClick={() => onReaction(comment.id, emoji)}
                    disabled={!currentUserId}
                    aria-label={`${count} réaction${count > 1 ? 's' : ''} ${emoji}`}
                    aria-pressed={hasReacted}
                  >
                    <span className="reaction-emoji">{emoji}</span>
                    {count > 0 && <span className="reaction-count">{count}</span>}
                  </button>
                )
              })}
            </div>
          )}

          <footer className="comment-footer">
            <button 
              className="reply-btn"
              onClick={() => onReply(comment.id)}
              disabled={!currentUserId}
            >
              <span>💬</span> Répondre
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}