import { computed } from 'vue'
import store from '../store'
import type { BlogPost } from '../types/blog'

export interface BackendHealth {
  status: string
  engine: string
  database: string
  counts: {
    posts: number
    jobs: number
    comments: number
    socials: number
  }
  timestamp: string
}

let initialized = false

export function useBlogStore() {
  if (!initialized) {
    initialized = true
    store.dispatch('fetchPosts')
  }

  const posts = computed<BlogPost[]>(() => store.state.posts)
  const isLoading = computed<boolean>(() => store.state.isLoadingPosts)
  const backendConnected = computed<boolean>(() => store.state.backendConnected)
  const backendHealth = computed<BackendHealth | null>(() => store.state.backendHealth)

  const fetchPosts = (): Promise<BlogPost[]> => store.dispatch('fetchPosts')
  const fetchBackendHealth = (): Promise<BackendHealth | null> => store.dispatch('fetchBackendHealth')
  const getPosts = (): BlogPost[] => store.getters.allPosts
  const getPostBySlug = (slug: string): BlogPost | undefined => store.getters.postBySlug(slug)
  const savePost = (postData: Partial<BlogPost> & { title: string; content: string }): Promise<BlogPost> =>
    store.dispatch('savePost', postData)
  const deletePost = (idOrSlug: string): Promise<void> => store.dispatch('deletePost', idOrSlug)
  const resetPosts = (): Promise<void> => store.dispatch('resetPosts')

  return {
    posts,
    isLoading,
    backendConnected,
    backendHealth,
    fetchPosts,
    fetchBackendHealth,
    getPosts,
    getPostBySlug,
    savePost,
    deletePost,
    resetPosts,
  }
}
