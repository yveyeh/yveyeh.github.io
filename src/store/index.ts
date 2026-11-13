import { createStore } from 'vuex'
import { initialPosts } from '../data/posts'
import { socials as defaultSocials, type SocialItem } from '../data/socials'
import type { BlogPost } from '../types/blog'
import type { TechJob } from '../types/job'
import type { BackendHealth } from '../data/blogStore'
import type { SiteProfileData } from '../data/profileStore'

export interface RootState {
  posts: BlogPost[]
  jobs: TechJob[]
  profile: SiteProfileData
  socials: SocialItem[]
  backendConnected: boolean
  backendHealth: BackendHealth | null
  isLoadingPosts: boolean
  isLoadingJobs: boolean
}

const defaultProfile: SiteProfileData = {
  name: 'Didier Yufenyuy Veyeh',
  shortName: 'Didier Y. Veyeh',
  nickname: 'Didi',
  title: 'DevSecOps Solutions Architect',
  shortTitle: 'DevSecOps Architect',
  email: 'didi@yveyeh.dev',
  avatar: '/assets/img/didier-headshot.jpg',
  statusBadge: 'Available for Projects',
  bio: 'Welcome to my digital space. I am a DevSecOps Solutions Architect dedicated to engineering secure-by-design cloud infrastructure, automated CI/CD security pipelines, and resilient software systems. Explore my open-source projects, architecture blueprints, and technical publications.',
  githubUrl: 'https://github.com/yveyeh?tab=repositories',
  gitlabUrl: 'https://gitlab.com/yveyeh',
  bookingUrl: 'https://calendar.app.google/aG7cdAD42dc22dcq7',
}

const fallbackJobs: TechJob[] = [
  {
    id: 'job-lead-devsecops-architect',
    title: 'Lead DevSecOps Architect',
    company: 'CloudNative Security Corp',
    location: 'Remote (Global / EMEA)',
    workplaceType: 'remote',
    employmentType: 'full-time',
    salaryRange: '$165,000 - $210,000 USD',
    referralLink: 'https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/',
    description: 'Spearhead zero-trust cloud infrastructure, automated supply-chain verification (Cosign/Sigstore), ephemeral OIDC credentials, and GitOps policy enforcement across multi-tenant Kubernetes clusters.',
    tags: ['DevSecOps', 'Kubernetes', 'Cosign', 'Kyverno', 'Terraform', 'AWS'],
    datePosted: '2026-10-24T10:00:00.000Z',
    featured: true,
  },
]

export const store = createStore<RootState>({
  state: () => ({
    posts: [...(initialPosts as BlogPost[])],
    jobs: [...fallbackJobs],
    profile: { ...defaultProfile },
    socials: [...defaultSocials],
    backendConnected: false,
    backendHealth: null,
    isLoadingPosts: false,
    isLoadingJobs: false,
  }),

  getters: {
    allPosts: (state): BlogPost[] => state.posts,
    postBySlug: (state) => (slug: string): BlogPost | undefined =>
      state.posts.find((p) => p.slug === slug),
    allJobs: (state): TechJob[] => state.jobs,
    jobById: (state) => (id: string): TechJob | undefined =>
      state.jobs.find((j) => j.id === id),
    siteProfile: (state): SiteProfileData => state.profile,
    socialLinks: (state): SocialItem[] => state.socials,
  },

  mutations: {
    SET_POSTS(state, posts: BlogPost[]) {
      state.posts = posts
    },
    UPSERT_POST(state, post: BlogPost) {
      const idx = state.posts.findIndex((p) => p.id === post.id || p.slug === post.slug)
      if (idx >= 0) {
        state.posts[idx] = post
      } else {
        state.posts.unshift(post)
      }
    },
    REMOVE_POST(state, idOrSlug: string) {
      state.posts = state.posts.filter((p) => p.id !== idOrSlug && p.slug !== idOrSlug)
    },
    SET_JOBS(state, jobs: TechJob[]) {
      state.jobs = jobs
    },
    ADD_JOB(state, job: TechJob) {
      state.jobs.unshift(job)
    },
    UPDATE_JOB(state, updatedJob: TechJob) {
      const idx = state.jobs.findIndex((j) => j.id === updatedJob.id)
      if (idx !== -1) {
        state.jobs[idx] = updatedJob
      }
    },
    REMOVE_JOB(state, id: string) {
      state.jobs = state.jobs.filter((j) => j.id !== id)
    },
    SET_PROFILE(state, profile: Partial<SiteProfileData>) {
      state.profile = { ...defaultProfile, ...profile }
    },
    SET_SOCIALS(state, socials: SocialItem[]) {
      state.socials = socials
    },
    SET_BACKEND_HEALTH(state, health: BackendHealth | null) {
      state.backendHealth = health
      state.backendConnected = Boolean(health && health.status === 'ok')
    },
    SET_BACKEND_CONNECTED(state, connected: boolean) {
      state.backendConnected = connected
    },
    SET_LOADING_POSTS(state, loading: boolean) {
      state.isLoadingPosts = loading
    },
    SET_LOADING_JOBS(state, loading: boolean) {
      state.isLoadingJobs = loading
    },
  },

  actions: {
    async fetchBackendHealth({ commit }): Promise<BackendHealth | null> {
      try {
        const res = await fetch('/api/health')
        if (res.ok) {
          const data: BackendHealth = await res.json()
          commit('SET_BACKEND_HEALTH', data)
          return data
        }
      } catch {
        commit('SET_BACKEND_CONNECTED', false)
      }
      return null
    },

    async fetchPosts({ commit, state }): Promise<BlogPost[]> {
      commit('SET_LOADING_POSTS', true)
      try {
        const res = await fetch('/api/posts')
        if (res.ok) {
          const data: BlogPost[] = await res.json()
          commit('SET_POSTS', data)
          commit('SET_BACKEND_CONNECTED', true)
          return data
        }
      } catch (err) {
        console.warn('Backend API unreachable, using fallback seed posts:', err)
        commit('SET_BACKEND_CONNECTED', false)
      } finally {
        commit('SET_LOADING_POSTS', false)
      }
      return state.posts
    },

    async savePost(
      { commit, dispatch },
      postData: Partial<BlogPost> & { title: string; content: string }
    ): Promise<BlogPost> {
      const payload = {
        id: postData.id || `post-${Date.now()}`,
        slug:
          postData.slug ||
          postData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        title: postData.title,
        summary: postData.summary || '',
        category: postData.category || 'DevSecOps',
        tags: postData.tags || [],
        date: postData.date || new Date().toISOString().split('T')[0],
        readTime:
          postData.readTime ||
          `${Math.max(1, Math.round((postData.content || '').split(/\s+/).length / 200))} min read`,
        featured: postData.featured || false,
        author: postData.author || {
          name: 'Didier Yufenyuy Veyeh',
          title: 'DevSecOps Solutions Architect',
          avatar: '/assets/img/didier-headshot.jpg',
        },
        content: postData.content,
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to save post to backend database')
      }

      const saved: BlogPost = await res.json()
      commit('UPSERT_POST', saved)
      dispatch('fetchBackendHealth')
      return saved
    },

    async deletePost({ commit, dispatch }, idOrSlug: string): Promise<void> {
      const res = await fetch(`/api/posts/${encodeURIComponent(idOrSlug)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete post from backend database')
      }
      commit('REMOVE_POST', idOrSlug)
      dispatch('fetchBackendHealth')
    },

    async resetPosts({ commit, dispatch }): Promise<void> {
      const res = await fetch('/api/posts/reset', { method: 'POST' })
      if (res.ok) {
        const data: BlogPost[] = await res.json()
        commit('SET_POSTS', data)
        dispatch('fetchBackendHealth')
      }
    },

    async fetchJobs({ commit, state }): Promise<TechJob[]> {
      commit('SET_LOADING_JOBS', true)
      try {
        const res = await fetch('/api/jobs')
        if (res.ok) {
          const data: TechJob[] = await res.json()
          commit('SET_JOBS', data)
          return data
        }
      } catch (err) {
        console.warn('Failed to fetch jobs from backend API:', err)
      } finally {
        commit('SET_LOADING_JOBS', false)
      }
      return state.jobs
    },

    async addJob(
      { commit, dispatch },
      jobData: Omit<TechJob, 'id' | 'datePosted'>
    ): Promise<TechJob> {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create job opportunity')
      }
      const created: TechJob = await res.json()
      commit('ADD_JOB', created)
      dispatch('fetchBackendHealth')
      return created
    },

    async updateJob(
      { commit },
      { id, updatedFields }: { id: string; updatedFields: Partial<TechJob> }
    ): Promise<boolean> {
      const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update job opportunity')
      }
      const updated: TechJob = await res.json()
      commit('UPDATE_JOB', updated)
      return true
    },

    async deleteJob({ commit, dispatch }, id: string): Promise<void> {
      const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete job opportunity')
      }
      commit('REMOVE_JOB', id)
      dispatch('fetchBackendHealth')
    },

    async resetJobs({ commit, dispatch }): Promise<void> {
      const res = await fetch('/api/jobs/reset', { method: 'POST' })
      if (res.ok) {
        const data: TechJob[] = await res.json()
        commit('SET_JOBS', data)
        dispatch('fetchBackendHealth')
      }
    },

    async fetchProfileAndSocials({ commit }): Promise<void> {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            commit('SET_PROFILE', data.profile)
          }
          if (Array.isArray(data.socials) && data.socials.length) {
            const iconMap = new Map(defaultSocials.map((s) => [s.id, s.icon]))
            const mapped: SocialItem[] = data.socials.map((s: any) => ({
              id: s.id,
              label: s.label,
              href: s.href,
              bg: s.bg,
              icon: iconMap.get(s.id) || defaultSocials[0].icon,
            }))
            commit('SET_SOCIALS', mapped)
          }
        }
      } catch {}
    },
  },
})

export default store

