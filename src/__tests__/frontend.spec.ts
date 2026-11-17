import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

import { formatRelativeTime, formatDate } from '../utils/date'
import store from '../store'
import { useBlogStore } from '../data/blogStore'
import { useJobStore } from '../data/jobStore'
import { useProfileStore } from '../data/profileStore'
import { initialPosts } from '../data/posts'
import { socials } from '../data/socials'
import { useBlogInteractions } from '../composables/useBlogInteractions'
import router from '../router'
import App from '../App'

import BrandIcon from '../components/BrandIcon/BrandIcon'
import AppsLauncher from '../components/AppsLauncher/AppsLauncher'
import JobCard from '../components/jobs/JobCard/JobCard'
import JobFilterBar from '../components/jobs/JobFilterBar/JobFilterBar'
import ArticleHeader from '../components/blog/ArticleHeader/ArticleHeader'
import AuthorBioCard from '../components/blog/AuthorBioCard/AuthorBioCard'
import CommentForm from '../components/blog/CommentForm/CommentForm'
import CommentItem from '../components/blog/CommentItem/CommentItem'
import PostCard from '../components/blog/PostCard/PostCard'
import PostCommentsSection from '../components/blog/PostCommentsSection/PostCommentsSection'
import PostInteractionBar from '../components/blog/PostInteractionBar/PostInteractionBar'
import PostMetrics from '../components/blog/PostMetrics/PostMetrics'
import PostReactions from '../components/blog/PostReactions/PostReactions'
import PostShareBar from '../components/blog/PostShareBar/PostShareBar'
import ReadingProgressBar from '../components/blog/ReadingProgressBar/ReadingProgressBar'
import RecommendedCard from '../components/blog/RecommendedCard/RecommendedCard'

import HomeView from '../views/HomeView/HomeView'
import BlogListView from '../views/BlogListView/BlogListView'
import BlogPostView from '../views/BlogPostView/BlogPostView'
import JobsView from '../views/JobsView/JobsView'
import AdminStudioView from '../views/AdminStudioView/AdminStudioView'

// Helper for mocking global fetch
function mockFetchResponse(data: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  })
}

describe('1. Date & Relative Time Utilities (src/utils/date.ts)', () => {
  it('handles undefined, NaN strings, future timestamps, and all relative intervals', () => {
    const now = Date.now()
    expect(formatRelativeTime(undefined)).toBe('Just now')
    expect(formatRelativeTime('legacy-string')).toBe('legacy-string')
    expect(formatRelativeTime(now + 60_000)).toBe('Just now')
    expect(formatRelativeTime(now - 15_000)).toBe('Just now')
    expect(formatRelativeTime(now - 5 * 60_000)).toBe('5m ago')
    expect(formatRelativeTime(now - 3 * 3600_000)).toBe('3h ago')
    expect(formatRelativeTime(now - 4 * 86400_000)).toBe('4d ago')
    expect(formatRelativeTime(now - 14 * 86400_000)).toBe('2w ago')
    expect(formatRelativeTime('2025-01-15T00:00:00.000Z')).toContain('2025')
  })

  it('formats standard dates and returns fallback on invalid date strings', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
    expect(formatDate('2026-10-29T00:00:00.000Z')).toContain('2026')
  })
})

describe('2. Vuex Store & Data Store Wrappers (src/store/index.ts & src/data/*)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('verifies seed data exports and Vuex mutations/getters', () => {
    expect(initialPosts.length).toBeGreaterThan(0)
    expect(socials.length).toBeGreaterThan(0)

    store.commit('SET_LOADING_POSTS', true)
    expect(store.state.isLoadingPosts).toBe(true)
    store.commit('SET_LOADING_POSTS', false)

    store.commit('SET_LOADING_JOBS', true)
    expect(store.state.isLoadingJobs).toBe(true)
    store.commit('SET_LOADING_JOBS', false)

    store.commit('SET_BACKEND_HEALTH', {
      status: 'ok',
      engine: 'mysql',
      database: 'yveyeh_portfolio',
      counts: { posts: 8, jobs: 5, comments: 8, socials: 9 },
      timestamp: '2026-11-13T00:00:00Z',
    })
    expect(store.state.backendConnected).toBe(true)
    store.commit('SET_BACKEND_CONNECTED', false)
    expect(store.state.backendConnected).toBe(false)

    // UPSERT_POST new and existing
    const samplePost = {
      ...initialPosts[0],
      id: 'custom-post-1',
      slug: 'custom-post-1',
      title: 'Custom Post',
    }
    store.commit('UPSERT_POST', samplePost)
    expect(store.getters.postBySlug('custom-post-1')?.title).toBe('Custom Post')

    store.commit('UPSERT_POST', { ...samplePost, title: 'Custom Post Updated' })
    expect(store.getters.postBySlug('custom-post-1')?.title).toBe('Custom Post Updated')

    store.commit('REMOVE_POST', 'custom-post-1')
    expect(store.getters.postBySlug('custom-post-1')).toBeUndefined()

    // Job mutations & getters
    const sampleJob = {
      id: 'job-test-1',
      title: 'DevSecOps Engineer',
      company: 'TestCorp',
      location: 'Remote',
      workplaceType: 'remote' as const,
      employmentType: 'full-time' as const,
      referralLink: 'https://example.com',
      description: 'Desc',
      tags: ['AWS'],
      datePosted: '2026-11-13',
      featured: false,
    }
    store.commit('ADD_JOB', sampleJob)
    expect(store.getters.jobById('job-test-1')?.company).toBe('TestCorp')

    store.commit('UPDATE_JOB', { ...sampleJob, company: 'UpdatedCorp' })
    expect(store.getters.jobById('job-test-1')?.company).toBe('UpdatedCorp')

    store.commit('REMOVE_JOB', 'job-test-1')
    expect(store.getters.jobById('job-test-1')).toBeUndefined()

    store.commit('SET_PROFILE', { nickname: 'DidiTest' })
    expect(store.getters.siteProfile.nickname).toBe('DidiTest')

    store.commit('SET_SOCIALS', socials)
    expect(store.getters.socialLinks.length).toBe(socials.length)
  })

  it('executes Vuex async actions and store wrappers (success & error branches)', async () => {
    // Health check success & failure
    globalThis.fetch = mockFetchResponse({
      status: 'ok',
      engine: 'mysql',
      database: 'yveyeh_portfolio',
      counts: { posts: 8, jobs: 5, comments: 8, socials: 9 },
      timestamp: 'now',
    })
    const blogStore = useBlogStore()
    const health = await blogStore.fetchBackendHealth()
    expect(health?.status).toBe('ok')

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network down'))
    expect(await blogStore.fetchBackendHealth()).toBeNull()
    expect(await blogStore.fetchPosts()).toEqual(store.state.posts)

    // fetchPosts success
    globalThis.fetch = mockFetchResponse(initialPosts)
    const fetchedPosts = await blogStore.fetchPosts()
    expect(fetchedPosts.length).toBe(initialPosts.length)
    expect(blogStore.getPosts().length).toBe(initialPosts.length)
    expect(blogStore.getPostBySlug(initialPosts[0].slug)?.slug).toBe(initialPosts[0].slug)

    // savePost success & failure
    const savedMock = { ...initialPosts[0], id: 'saved-1', slug: 'saved-slug', title: 'Saved Title' }
    globalThis.fetch = mockFetchResponse(savedMock)
    const saved = await blogStore.savePost({ title: 'Saved Title', content: 'Body text' })
    expect(saved.slug).toBe('saved-slug')

    globalThis.fetch = mockFetchResponse({ error: 'Validation failed' }, false, 400)
    await expect(blogStore.savePost({ title: 'Bad', content: '' })).rejects.toThrow('Validation failed')

    // deletePost success & failure
    globalThis.fetch = mockFetchResponse({ deleted: true })
    await blogStore.deletePost('saved-1')

    globalThis.fetch = mockFetchResponse({}, false, 500)
    await expect(blogStore.deletePost('saved-1')).rejects.toThrow('Failed to delete post')

    // resetPosts
    globalThis.fetch = mockFetchResponse(initialPosts)
    await blogStore.resetPosts()

    // JobStore wrapper actions
    const jobStore = useJobStore()
    globalThis.fetch = mockFetchResponse(store.state.jobs)
    await jobStore.fetchJobs()
    expect(jobStore.getJobs().length).toBeGreaterThan(0)

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Offline'))
    await jobStore.fetchJobs()

    const newJob = {
      title: 'Cloud Architect',
      company: 'Acme',
      location: 'Remote',
      workplaceType: 'remote' as const,
      employmentType: 'full-time' as const,
      referralLink: 'https://acme.io',
      description: 'Role',
      tags: ['Cloud'],
      featured: true,
    }
    globalThis.fetch = mockFetchResponse({ ...newJob, id: 'job-99', datePosted: '2026-11-13' })
    const createdJob = await jobStore.addJob(newJob)
    expect(createdJob.id).toBe('job-99')
    expect(jobStore.getJobById('job-99')?.title).toBe('Cloud Architect')

    globalThis.fetch = mockFetchResponse({ error: 'Invalid job' }, false, 400)
    await expect(jobStore.addJob(newJob)).rejects.toThrow('Invalid job')

    globalThis.fetch = mockFetchResponse({ ...createdJob, title: 'Updated Cloud Architect' })
    expect(await jobStore.updateJob('job-99', { title: 'Updated Cloud Architect' })).toBe(true)

    globalThis.fetch = mockFetchResponse({ error: 'Job update error' }, false, 400)
    await expect(jobStore.updateJob('job-99', {})).rejects.toThrow('Job update error')

    globalThis.fetch = mockFetchResponse({ deleted: true })
    await jobStore.deleteJob('job-99')

    globalThis.fetch = mockFetchResponse({}, false, 404)
    await expect(jobStore.deleteJob('job-99')).rejects.toThrow('Failed to delete job')

    globalThis.fetch = mockFetchResponse(store.state.jobs)
    await jobStore.resetJobs()

    // ProfileStore wrapper
    const profileStore = useProfileStore()
    globalThis.fetch = mockFetchResponse({
      profile: { nickname: 'Didi', name: 'Didier Yufenyuy Veyeh' },
      socials: [{ id: 'github', label: 'GitHub', href: 'https://github.com/yveyeh', bg: 'bg-black' }],
    })
    await profileStore.fetchProfileAndSocials()
    expect(profileStore.profile.value.nickname).toBe('Didi')
    expect(profileStore.socialLinks.value.length).toBe(1)
  })
})

describe('3. Blog Interactions Composable (src/composables/useBlogInteractions.ts)', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = mockFetchResponse({
      views: 200,
      shares: 15,
      reactions: { fire: 10, smart: 5, rocket: 3, shield: 8, heart: 4 },
      comments: [],
    })
  })

  it('fetches interactions, tracks views/shares, toggles reactions, and posts comments', async () => {
    const { interactions, trackView, trackShare, toggleReaction, addComment } =
      useBlogInteractions('zero-trust-cicd-pipeline')
    await flushPromises()
    expect(interactions.views).toBe(200)

    // trackView increments once per instance
    globalThis.fetch = mockFetchResponse({ views: 201 })
    await trackView()
    expect(interactions.views).toBe(201)
    await trackView() // second call is no-op

    // trackShare
    globalThis.fetch = mockFetchResponse({ shares: 16 })
    await trackShare()
    expect(interactions.shares).toBe(16)

    // toggleReaction increment & decrement
    globalThis.fetch = mockFetchResponse({
      reactions: { fire: 11, smart: 5, rocket: 3, shield: 8, heart: 4 },
    })
    await toggleReaction('fire')
    expect(interactions.userReactions.fire).toBe(true)
    expect(interactions.reactions.fire).toBe(11)

    globalThis.fetch = mockFetchResponse({
      reactions: { fire: 10, smart: 5, rocket: 3, shield: 8, heart: 4 },
    })
    await toggleReaction('fire')
    expect(interactions.userReactions.fire).toBe(false)

    // addComment validation & success
    expect(await addComment('   ', '')).toBe(false)

    globalThis.fetch = mockFetchResponse({
      comments: [
        {
          id: 'c1',
          authorName: 'Alice',
          authorHandle: '@alice',
          content: 'Awesome!',
          createdAt: new Date().toISOString(),
          avatarColor: 'bg-blue-600',
        },
      ],
    })
    expect(await addComment('Alice', 'Awesome!', '@alice')).toBe(true)
    expect(interactions.comments.length).toBe(1)

    // addComment error handling
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    expect(await addComment('Bob', 'Hi')).toBe(false)

    // Empty slug & network error guard branches
    const emptySlugInter = useBlogInteractions('')
    await emptySlugInter.fetchInteractions()
    await emptySlugInter.trackView()
    await emptySlugInter.trackShare()
    await emptySlugInter.toggleReaction('fire')
    expect(await emptySlugInter.addComment('Bob', 'Hi')).toBe(false)

    const errInter = useBlogInteractions('error-slug')
    await flushPromises()
    await errInter.trackView()
    await errInter.trackShare()
    await errInter.toggleReaction('rocket')
  })
})

describe('4. Router & Root App Component (src/router/index.ts & src/App.ts)', () => {
  it('navigates routes, updates document.title, and renders App', async () => {
    globalThis.fetch = mockFetchResponse(initialPosts)
    await router.push('/')
    await router.isReady()
    expect(document.title).toContain('Didi Online')

    await router.push('/blog')
    expect(document.title).toContain('Blog')

    await router.push('/jobs')
    expect(document.title).toContain('Tech Job Opportunities')

    const scrollBehavior = router.options.scrollBehavior!
    expect(scrollBehavior({} as any, {} as any, { left: 0, top: 120 })).toEqual({ left: 0, top: 120 })
    expect(scrollBehavior({} as any, {} as any, null)).toEqual({ top: 0 })

    const wrapper = mount(App, {
      global: { plugins: [router, store] },
    })
    expect(wrapper.exists()).toBe(true)
  })
})

describe('5. UI Components (BrandIcon, AppsLauncher, JobCard, JobFilterBar, Blog Components)', () => {
  it('renders BrandIcon and handles AppsLauncher open/close/Escape/outside-click', async () => {
    const iconWrapper = mount(BrandIcon, { props: { icon: faGithub } })
    expect(iconWrapper.find('svg').attributes('viewBox')).toBeDefined()

    const arrayIconWrapper = mount(BrandIcon, {
      props: { icon: { icon: [512, 512, [], '', ['M0 0', 'L10 10']] } as any },
    })
    expect((arrayIconWrapper.vm as any).pathData).toContain('M0 0 L10 10')

    const emptyIconWrapper = mount(BrandIcon, {
      props: { icon: {} as any },
    })
    expect((emptyIconWrapper.vm as any).viewBox).toBe('0 0 512 512')
    expect((emptyIconWrapper.vm as any).pathData).toBe('')

    const launcher = mount(AppsLauncher, {
      global: { plugins: [router, store] },
      attachTo: document.body,
    })
    expect((launcher.vm as any).open).toBe(false)
    ;(launcher.vm as any).toggle()
    expect((launcher.vm as any).open).toBe(true)

    // Outside pointerdown closes menu
    document.dispatchEvent(new Event('pointerdown'))
    expect((launcher.vm as any).open).toBe(false)

    // Escape key closes menu
    ;(launcher.vm as any).toggle()
    expect((launcher.vm as any).open).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect((launcher.vm as any).open).toBe(false)
    launcher.unmount()
  })

  it('renders JobCard across all workplace/employment types and JobFilterBar emits', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const variants = [
      { workplaceType: 'remote', employmentType: 'full-time' },
      { workplaceType: 'hybrid', employmentType: 'contract' },
      { workplaceType: 'in-office', employmentType: 'part-time' },
      { workplaceType: 'other' as any, employmentType: 'other' as any },
    ] as const

    for (const v of variants) {
      const card = mount(JobCard, {
        props: {
          job: {
            id: 'j1',
            title: 'Architect',
            company: 'Corp',
            location: 'Remote',
            workplaceType: v.workplaceType,
            employmentType: v.employmentType,
            salaryRange: '$150k',
            referralLink: 'https://apply.example.com',
            description: 'Desc',
            tags: ['K8s'],
            datePosted: new Date().toISOString(),
            featured: true,
          },
        },
      })
      expect(card.text()).toContain('Architect')
      expect((card.vm as any).workplaceBadgeClass).toBeTruthy()
      expect((card.vm as any).employmentBadgeClass).toBeTruthy()
      ;(card.vm as any).openReferral()
      expect(openSpy).toHaveBeenCalled()
    }

    const filterBar = mount(JobFilterBar, {
      props: {
        searchQuery: 'k8s',
        selectedWorkplace: 'all',
        selectedEmployment: 'all',
        totalJobsCount: 5,
        filteredCount: 2,
      },
    })
    ;(filterBar.vm as any).onSearch({ target: { value: 'terraform' } } as any)
    ;(filterBar.vm as any).clearSearch()
    ;(filterBar.vm as any).setWorkplace('remote')
    ;(filterBar.vm as any).setEmployment('contract')
    ;(filterBar.vm as any).onReset()
    expect(filterBar.emitted('update:searchQuery')?.length).toBe(2)
    expect(filterBar.emitted('update:selectedWorkplace')?.[0]).toEqual(['remote'])
    expect(filterBar.emitted('update:selectedEmployment')?.[0]).toEqual(['contract'])
    expect(filterBar.emitted('reset')?.length).toBe(1)
  })

  it('renders all 11 Blog components and verifies interactions', async () => {
    const samplePost = initialPosts[0]

    const header = mount(ArticleHeader, {
      props: { post: samplePost },
      global: { plugins: [router] },
    })
    expect(header.text()).toContain(samplePost.title)

    const bio = mount(AuthorBioCard, {
      props: { author: samplePost.author },
    })
    expect(bio.text()).toContain(samplePost.author.name)

    const form = mount(CommentForm)
    ;(form.vm as any).handleSubmit() // empty no-op
    ;(form.vm as any).name = 'John'
    ;(form.vm as any).handle = '@john'
    ;(form.vm as any).content = 'Great post!'
    ;(form.vm as any).handleSubmit()
    expect(form.emitted('submit')?.[0]).toEqual([
      { name: 'John', content: 'Great post!', handle: '@john' },
    ])

    const item = mount(CommentItem, {
      props: {
        comment: {
          id: 'c1',
          authorName: 'John',
          authorHandle: '@john',
          content: 'Nice!',
          createdAt: new Date().toISOString(),
          avatarColor: 'bg-blue-600',
        },
      },
    })
    expect(item.text()).toContain('John')
    item.unmount()

    const pCard = mount(PostCard, {
      props: { post: samplePost },
      global: { plugins: [router] },
    })
    expect(pCard.text()).toContain(samplePost.title)

    const commSection = mount(PostCommentsSection, {
      props: { comments: [] },
    })
    ;(commSection.vm as any).onAddComment({ name: 'Jane', content: 'Hello' })
    expect(commSection.emitted('add-comment')?.length).toBe(1)

    const reactionsProps = {
      reactions: { fire: 5, smart: 3, rocket: 2, shield: 4, heart: 1 },
      userReactions: { fire: true, smart: false, rocket: false, shield: false, heart: false },
    }
    const reactionsComp = mount(PostReactions, { props: reactionsProps })
    ;(reactionsComp.vm as any).onReact('fire')
    expect(reactionsComp.emitted('react')?.[0]).toEqual(['fire'])

    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    })
    const shareBar = mount(PostShareBar, {
      props: { title: 'Post Title', shares: 10 },
    })
    await (shareBar.vm as any).share()
    expect(shareBar.emitted('shared')?.length).toBe(1)
    expect(writeTextMock).toHaveBeenCalled()

    // Also test native navigator.share branch
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
    })
    await (shareBar.vm as any).share()
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })

    const interBar = mount(PostInteractionBar, {
      props: {
        title: 'Post Title',
        shares: 10,
        ...reactionsProps,
      },
    })
    ;(interBar.vm as any).onReact('shield')
    ;(interBar.vm as any).onShared()
    expect(interBar.emitted('react')?.[0]).toEqual(['shield'])
    expect(interBar.emitted('shared')?.length).toBe(1)

    const metrics = mount(PostMetrics, {
      props: { views: 100, shares: 10, commentsCount: 4, readTime: '5 min read' },
    })
    expect(metrics.text()).toContain('100')

    const progress = mount(ReadingProgressBar, { props: { progress: 65 } })
    expect(progress.exists()).toBe(true)

    const recCard = mount(RecommendedCard, {
      props: { post: samplePost },
      global: { plugins: [router] },
    })
    expect(recCard.text()).toContain(samplePost.title)
  })
})

describe('6. Views (HomeView, BlogListView, BlogPostView, JobsView, AdminStudioView)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    globalThis.fetch = mockFetchResponse(initialPosts)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mounts HomeView and completes typewriter animation', async () => {
    const wrapper = mount(HomeView, {
      global: { plugins: [router, store] },
    })
    await vi.advanceTimersByTimeAsync(5000)
    expect((wrapper.vm as any).isTyping).toBe(false)
    expect((wrapper.vm as any).showBadge).toBe(true)
    expect(wrapper.find('video').attributes('src')).toBe('/assets/video/system-design-flow.mp4')
  })

  it('mounts BlogListView and filters by category and search query', async () => {
    store.commit('SET_POSTS', initialPosts)
    const wrapper = mount(BlogListView, {
      global: { plugins: [router, store] },
    })
    expect((wrapper.vm as any).categories.length).toBeGreaterThan(1)
    expect((wrapper.vm as any).isFeaturedBannerVisible).toBe(true)

    ;(wrapper.vm as any).selectedCategory = initialPosts[0].category
    await nextTick()
    expect((wrapper.vm as any).isFeaturedBannerVisible).toBe(false)

    ;(wrapper.vm as any).selectedCategory = 'All'
    ;(wrapper.vm as any).searchQuery = 'docker'
    await nextTick()
    expect((wrapper.vm as any).filteredPosts.length).toBeGreaterThan(0)
  })

  it('mounts BlogPostView and exercises useBlogPost (scroll, copyLink, meta tags)', async () => {
    store.commit('SET_POSTS', initialPosts)
    await router.push(`/blog/${initialPosts[0].slug}`)
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    })

    const wrapper = mount(BlogPostView, {
      global: { plugins: [router, store] },
    })
    await flushPromises()
    expect((wrapper.vm as any).post?.slug).toBe(initialPosts[0].slug)
    expect((wrapper.vm as any).parsedContent).toContain('<')

    window.dispatchEvent(new Event('scroll'))
    await (wrapper.vm as any).copyLink()
    expect((wrapper.vm as any).copied).toBe(true)
    await vi.advanceTimersByTimeAsync(2500)
    expect((wrapper.vm as any).copied).toBe(false)

    // Test clipboard error branch & missing post slug branch
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')) },
      configurable: true,
    })
    await (wrapper.vm as any).copyLink()
    await router.push(`/blog/${initialPosts[1].slug}`)
    await flushPromises()
    await router.push('/blog/non-existent-slug')
    await flushPromises()
    wrapper.unmount()
  })

  it('mounts JobsView and exercises filtering, resetFilters, and openReferral', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    store.commit('SET_JOBS', [
      {
        id: 'j-1',
        title: 'Lead DevSecOps Architect',
        company: 'CloudNative Corp',
        location: 'Remote EMEA',
        workplaceType: 'remote',
        employmentType: 'full-time',
        referralLink: 'https://example.com/1',
        description: 'Zero-trust pipelines',
        tags: ['Cosign', 'Kubernetes'],
        datePosted: '2026-11-10',
        featured: true,
      },
      {
        id: 'j-2',
        title: 'Platform Engineer',
        company: 'FinTech Velocity',
        location: 'London',
        workplaceType: 'hybrid',
        employmentType: 'contract',
        referralLink: 'https://example.com/2',
        description: 'OpenTofu and Vault',
        tags: ['Terraform'],
        datePosted: '2026-11-11',
        featured: false,
      },
    ])
    const wrapper = mount(JobsView, {
      global: { plugins: [router, store] },
    })
    expect((wrapper.vm as any).allJobs.length).toBe(2)
    expect((wrapper.vm as any).isFeaturedBannerVisible).toBe(true)

    ;(wrapper.vm as any).selectedWorkplace = 'remote'
    ;(wrapper.vm as any).selectedEmployment = 'full-time'
    ;(wrapper.vm as any).searchQuery = 'fintech'
    await nextTick()
    expect((wrapper.vm as any).filteredJobs.length).toBe(0)

    ;(wrapper.vm as any).selectedWorkplace = 'all'
    ;(wrapper.vm as any).selectedEmployment = 'all'
    for (const q of ['fintech', 'london', 'opentofu', 'terraform', 'nomatch']) {
      ;(wrapper.vm as any).searchQuery = q
      await nextTick()
      void (wrapper.vm as any).filteredJobs
    }

    ;(wrapper.vm as any).resetFilters()
    expect((wrapper.vm as any).searchQuery).toBe('')
    ;(wrapper.vm as any).openReferral('https://linkedin.com')
    ;(wrapper.vm as any).openReferral('')
    expect(openSpy).toHaveBeenCalled()
  })

  it('mounts AdminStudioView and exercises auth, post CRUD, job CRUD, and markdown export', async () => {
    sessionStorage.clear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'open').mockImplementation(() => null)
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()

    const wrapper = mount(AdminStudioView, {
      global: { plugins: [router, store] },
    })
    const vm = wrapper.vm as any

    // 1. Login failure (401) & lockout (429) & success (200)
    globalThis.fetch = mockFetchResponse({ authenticated: false, error: 'Invalid passcode' }, false, 401)
    vm.passcode = 'wrong'
    await vm.checkPasscode()
    expect(vm.authError).toContain('Invalid passcode')

    globalThis.fetch = mockFetchResponse({ authenticated: false, lockedOut: true, remainingSeconds: 2 }, false, 429)
    await vm.checkPasscode()
    expect(vm.lockoutUntil).toBeGreaterThan(Date.now())
    await vi.advanceTimersByTimeAsync(3000)

    globalThis.fetch = mockFetchResponse({ authenticated: true, token: 'tok-123' }, true, 200)
    vm.passcode = 'didi2026'
    await vm.checkPasscode()
    expect(vm.isAuthenticated).toBe(true)

    // 2. Post operations: createNewPost, handleSave (validation + success), downloadMarkdown, handleDelete, handleResetPosts
    vm.createNewPost()
    vm.form.title = ''
    vm.downloadMarkdown() // empty title branch
    await vm.handleSave()
    expect(vm.isError).toBe(true)

    vm.form.title = 'Zero Trust Mesh'
    vm.form.slug = 'zero-trust-mesh'
    vm.form.tags = 'K8s, Security'
    vm.form.content = '# Heading'

    // handleSave error branch
    globalThis.fetch = mockFetchResponse({ error: 'DB error' }, false, 500)
    await vm.handleSave()
    expect(vm.isError).toBe(true)

    globalThis.fetch = mockFetchResponse({
      ...initialPosts[0],
      id: 'zt-1',
      slug: 'zero-trust-mesh',
      title: 'Zero Trust Mesh',
    })
    await vm.handleSave()
    expect(vm.selectedPostId).toBe('zt-1')

    vm.downloadMarkdown()
    expect(URL.createObjectURL).toHaveBeenCalled()

    // handleDelete guard & error & empty list branches
    await vm.handleDelete('')
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    await vm.handleDelete('zt-1')

    globalThis.fetch = mockFetchResponse({}, false, 500)
    await vm.handleDelete('zt-1')
    expect(vm.isError).toBe(true)

    store.commit('SET_POSTS', [{ ...initialPosts[0], id: 'zt-1', slug: 'zero-trust-mesh' }])
    globalThis.fetch = mockFetchResponse({ deleted: true })
    await vm.handleDelete('zt-1')

    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    await vm.handleResetPosts()
    globalThis.fetch = mockFetchResponse(initialPosts)
    await vm.handleResetPosts()

    // 3. Job operations: createNewJob, handleSaveJob (validation + create + update + error), testReferralLink, handleDeleteJob, handleResetJobs
    vm.createNewJob()
    vm.jobForm.title = ''
    await vm.handleSaveJob()
    expect(vm.isError).toBe(true)

    vm.jobForm.title = 'Platform Lead'
    vm.jobForm.company = 'CloudCo'
    vm.jobForm.referralLink = ''
    await vm.handleSaveJob()
    expect(vm.isError).toBe(true)

    vm.testReferralLink() // empty referral link error branch
    vm.jobForm.referralLink = 'https://cloudco.io/apply'
    vm.testReferralLink() // opens window

    // handleSaveJob error branch
    globalThis.fetch = mockFetchResponse({ error: 'Job DB error' }, false, 500)
    await vm.handleSaveJob()
    expect(vm.isError).toBe(true)

    globalThis.fetch = mockFetchResponse({
      id: 'job-new-1',
      title: 'Platform Lead',
      company: 'CloudCo',
      location: 'Remote',
      workplaceType: 'remote',
      employmentType: 'full-time',
      referralLink: 'https://cloudco.io/apply',
      description: 'Desc',
      tags: ['K8s'],
      datePosted: '2026-11-13',
      featured: true,
    })
    await vm.handleSaveJob() // creates new job
    expect(vm.selectedJobId).toBe('job-new-1')

    await vm.handleSaveJob() // updates existing job

    // handleDeleteJob confirm false, error, and empty jobs branch
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    await vm.handleDeleteJob('job-new-1')

    globalThis.fetch = mockFetchResponse({}, false, 500)
    await vm.handleDeleteJob('job-new-1')
    expect(vm.isError).toBe(true)

    store.commit('SET_JOBS', [
      {
        id: 'job-new-1',
        title: 'Platform Lead',
        company: 'CloudCo',
        location: 'Remote',
        workplaceType: 'remote',
        employmentType: 'full-time',
        referralLink: 'https://cloudco.io/apply',
        description: 'Desc',
        tags: ['K8s'],
        datePosted: '2026-11-13',
        featured: true,
      },
    ])
    globalThis.fetch = mockFetchResponse({ deleted: true })
    await vm.handleDeleteJob('job-new-1')

    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    await vm.handleResetJobs()
    globalThis.fetch = mockFetchResponse(store.state.jobs)
    await vm.handleResetJobs()
    await vm.refreshDatabase()

    // 4. Offline SHA-256 fallback login & error branches
    await vm.logout()
    expect(vm.isAuthenticated).toBe(false)

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Backend offline'))
    for (let i = 0; i < 3; i++) {
      vm.passcode = 'bad-offline-pass'
      await vm.checkPasscode()
    }
    expect(vm.lockoutUntil).toBeGreaterThan(Date.now())
    vm.lockoutUntil = 0

    vm.passcode = 'didi2026'
    await vm.checkPasscode()
    expect(vm.isAuthenticated).toBe(true)

    // Test sessionStorage pre-authenticated & expired mount branches
    sessionStorage.setItem('yveyeh_admin_auth', 'true')
    sessionStorage.setItem('yveyeh_admin_auth_ts', Date.now().toString())
    const wValid = mount(AdminStudioView, { global: { plugins: [router, store] } })
    expect((wValid.vm as any).isAuthenticated).toBe(true)
    wValid.unmount()

    sessionStorage.setItem('yveyeh_admin_auth', 'true')
    sessionStorage.setItem('yveyeh_admin_auth_ts', (Date.now() - 99_999_999).toString())
    const wExpired = mount(AdminStudioView, { global: { plugins: [router, store] } })
    expect((wExpired.vm as any).isAuthenticated).toBe(false)
    wExpired.unmount()

    wrapper.unmount()
  })
})
