import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import type { PostInteractions, ReactionType, BlogComment } from '../types/blog'

const STORAGE_PREFIX = 'yveyeh_post_interactions_'

// Baseline realistic seed interactions per article slug
const baselineMetrics: Record<string, { views: number; shares: number; reactions: { fire: number; smart: number; rocket: number; shield: number; heart: number } }> = {
  'introduction-to-docker-guide': {
    views: 342,
    shares: 28,
    reactions: { fire: 42, smart: 35, rocket: 29, shield: 38, heart: 19 }
  },
  'zero-trust-cicd-pipeline': {
    views: 512,
    shares: 44,
    reactions: { fire: 63, smart: 48, rocket: 31, shield: 72, heart: 27 }
  },
  'terraform-opentofu-multi-cloud': {
    views: 289,
    shares: 19,
    reactions: { fire: 27, smart: 39, rocket: 22, shield: 34, heart: 15 }
  },
  'kubernetes-secrets-vault-operator': {
    views: 405,
    shares: 32,
    reactions: { fire: 45, smart: 51, rocket: 28, shield: 61, heart: 23 }
  }
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-cyan-600'
]

export function useBlogInteractions(slug: string) {
  const storageKey = `${STORAGE_PREFIX}${slug}`
  const channelName = `yveyeh_channel_${slug}`
  let broadcastChannel: BroadcastChannel | null = null

  const getInitialState = (): PostInteractions => {
    const baseline = baselineMetrics[slug] || {
      views: 120,
      shares: 10,
      reactions: { fire: 12, smart: 8, rocket: 10, shield: 15, heart: 7 }
    }

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          views: Math.max(parsed.views || 0, baseline.views),
          shares: Math.max(parsed.shares || 0, baseline.shares),
          reactions: {
            fire: Math.max(parsed.reactions?.fire || 0, baseline.reactions.fire),
            smart: Math.max(parsed.reactions?.smart || 0, baseline.reactions.smart),
            rocket: Math.max(parsed.reactions?.rocket || 0, baseline.reactions.rocket),
            shield: Math.max(parsed.reactions?.shield || 0, baseline.reactions.shield),
            heart: Math.max(parsed.reactions?.heart || 0, baseline.reactions.heart),
          },
          userReactions: parsed.userReactions || { fire: false, smart: false, rocket: false, shield: false, heart: false },
          comments: parsed.comments || []
        }
      }
    } catch (e) {
      console.error('Error loading post interactions:', e)
    }

    // Default seed with realistic timestamp (2 days ago in ISO)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

    return {
      views: baseline.views,
      shares: baseline.shares,
      reactions: { ...baseline.reactions },
      userReactions: { fire: false, smart: false, rocket: false, shield: false, heart: false },
      comments: [
        {
          id: 'comm-seed-1',
          authorName: 'Alex Rivera',
          authorHandle: '@arivera_sec',
          content: 'The real-world analogies make this so clear. Sharing with my junior cloud team right away!',
          createdAt: twoDaysAgo,
          avatarColor: 'bg-emerald-600'
        }
      ]
    }
  }

  const interactions = reactive<PostInteractions>(getInitialState())
  const hasIncrementedView = ref(false)

  const syncFromData = (data: Partial<PostInteractions>) => {
    if (data.views !== undefined) interactions.views = data.views
    if (data.shares !== undefined) interactions.shares = data.shares
    if (data.reactions) {
      interactions.reactions = { ...interactions.reactions, ...data.reactions }
    }
    if (data.comments) {
      interactions.comments = [...data.comments]
    }
  }

  const persist = (broadcast = true) => {
    try {
      const serialized = JSON.stringify(interactions)
      localStorage.setItem(storageKey, serialized)
      if (broadcast && broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'SYNC',
          payload: serialized
        })
      }
    } catch (e) {
      console.error('Error persisting interactions:', e)
    }
  }

  // Handle external storage updates (cross-tab sync fallback)
  const onStorageEvent = (event: StorageEvent) => {
    if (event.key === storageKey && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue)
        syncFromData(parsed)
      } catch (e) {
        console.error('Error syncing storage event:', e)
      }
    }
  }

  // Setup Realtime BroadcastChannel
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(channelName)
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'SYNC' && event.data.payload) {
          try {
            const parsed = JSON.parse(event.data.payload)
            syncFromData(parsed)
          } catch (e) {
            console.error('Error parsing broadcast sync:', e)
          }
        }
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment, falling back to storage listener.')
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorageEvent)
  }

  const trackView = () => {
    if (!hasIncrementedView.value) {
      interactions.views += 1
      hasIncrementedView.value = true
      persist()
    }
  }

  const trackShare = () => {
    interactions.shares += 1
    persist()
  }

  const toggleReaction = (type: ReactionType) => {
    const isReacted = interactions.userReactions[type]
    if (isReacted) {
      interactions.reactions[type] = Math.max(0, interactions.reactions[type] - 1)
      interactions.userReactions[type] = false
    } else {
      interactions.reactions[type] += 1
      interactions.userReactions[type] = true
    }
    persist()
  }

  const addComment = (name: string, content: string, handle?: string) => {
    const cleanName = name.trim()
    const cleanContent = content.trim()
    if (!cleanName || !cleanContent) return false

    // Real timestamp stored as ISO string so relative time dynamically updates
    const newComment: BlogComment = {
      id: `comm-${Date.now()}`,
      authorName: cleanName,
      authorHandle: handle?.trim() || undefined,
      content: cleanContent,
      createdAt: new Date().toISOString(),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    }

    interactions.comments.unshift(newComment)
    persist()
    return true
  }

  return {
    interactions,
    trackView,
    trackShare,
    toggleReaction,
    addComment
  }
}
