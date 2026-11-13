import { ref, reactive } from 'vue'
import type { PostInteractions, ReactionType } from '../types/blog'

const USER_REACTIONS_PREFIX = 'yveyeh_user_reactions_'

export function useBlogInteractions(slug: string) {
  const userReactionKey = `${USER_REACTIONS_PREFIX}${slug}`
  const channelName = `yveyeh_channel_${slug}`
  let broadcastChannel: BroadcastChannel | null = null

  const loadUserReactions = (): Record<ReactionType, boolean> => {
    try {
      const saved = localStorage.getItem(userReactionKey)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { fire: false, smart: false, rocket: false, shield: false, heart: false }
  }

  const saveUserReactions = (ur: Record<ReactionType, boolean>) => {
    try {
      localStorage.setItem(userReactionKey, JSON.stringify(ur))
    } catch {}
  }

  const interactions = reactive<PostInteractions>({
    views: 0,
    shares: 0,
    reactions: { fire: 0, smart: 0, rocket: 0, shield: 0, heart: 0 },
    userReactions: loadUserReactions(),
    comments: [],
  })

  const hasIncrementedView = ref(false)

  const applyServerState = (data: Partial<PostInteractions>) => {
    if (typeof data.views === 'number') interactions.views = data.views
    if (typeof data.shares === 'number') interactions.shares = data.shares
    if (data.reactions) {
      interactions.reactions = { ...interactions.reactions, ...data.reactions }
    }
    if (Array.isArray(data.comments)) {
      interactions.comments = data.comments
    }
  }

  const fetchInteractions = async () => {
    if (!slug) return
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/interactions`)
      if (res.ok) {
        const data = await res.json()
        applyServerState(data)
      }
    } catch (e) {
      console.warn('Error fetching post interactions from backend:', e)
    }
  }

  const notifyPeers = () => {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'REFRESH' })
      } catch {}
    }
  }

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(channelName)
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'REFRESH') {
          fetchInteractions()
        }
      }
    } catch {}
  }

  // Initial fetch from MySQL via Flask API
  fetchInteractions()

  const trackView = async () => {
    if (!slug || hasIncrementedView.value) return
    hasIncrementedView.value = true
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        applyServerState(data)
        notifyPeers()
      }
    } catch {}
  }

  const trackShare = async () => {
    if (!slug) return
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/share`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        applyServerState(data)
        notifyPeers()
      }
    } catch {}
  }

  const toggleReaction = async (type: ReactionType) => {
    if (!slug) return
    const wasReacted = interactions.userReactions[type]
    const action = wasReacted ? 'decrement' : 'increment'
    interactions.userReactions[type] = !wasReacted
    saveUserReactions(interactions.userReactions)

    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action }),
      })
      if (res.ok) {
        const data = await res.json()
        applyServerState(data)
        notifyPeers()
      }
    } catch {}
  }

  const addComment = async (name: string, content: string, handle?: string) => {
    const cleanName = name.trim()
    const cleanContent = content.trim()
    if (!cleanName || !cleanContent || !slug) return false

    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: cleanName,
          authorHandle: handle?.trim() || undefined,
          content: cleanContent,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        applyServerState(data)
        notifyPeers()
        return true
      }
    } catch (e) {
      console.error('Failed to post comment:', e)
    }
    return false
  }

  return {
    interactions,
    fetchInteractions,
    trackView,
    trackShare,
    toggleReaction,
    addComment,
  }
}
