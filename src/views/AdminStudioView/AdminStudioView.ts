import template from './AdminStudioView.html?raw'
import { defineComponent, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import { useBlogStore } from '../../data/blogStore'
import { useJobStore } from '../../data/jobStore'
import type { BlogPost } from '../../types/blog'
import type { TechJob, WorkplaceType, EmploymentType } from '../../types/job'

// Fallback SHA-256 hash of "didi2026" if offline
const PASSCODE_HASH = '56bd199fde762b620319103e55a58662bb5773ea3290f361206ff09b2b2c646a'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const MAX_FAILED_ATTEMPTS = 3
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export default defineComponent({
  name: 'AdminStudioView',
  template,
  setup() {
    const {
      posts,
      backendConnected,
      backendHealth,
      fetchPosts,
      fetchBackendHealth,
      savePost,
      deletePost,
      resetPosts,
    } = useBlogStore()

    const {
      jobs,
      fetchJobs,
      addJob,
      updateJob,
      deleteJob,
      resetJobs,
    } = useJobStore()

    // --- Auth helpers ---
    const hashString = async (str: string): Promise<string> => {
      const encoder = new TextEncoder()
      const data = encoder.encode(str)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }

    const isAuthenticated = ref(false)
    const passcode = ref('')
    const authError = ref('')
    const failedAttempts = ref(0)
    const lockoutUntil = ref(0)
    const lockoutMessage = ref('')

    let lockoutTimer: ReturnType<typeof setInterval> | null = null

    const startLockoutCountdown = () => {
      if (lockoutTimer) clearInterval(lockoutTimer)
      lockoutTimer = setInterval(() => {
        const remaining = lockoutUntil.value - Date.now()
        if (remaining <= 0) {
          lockoutMessage.value = ''
          if (lockoutTimer) clearInterval(lockoutTimer)
          lockoutTimer = null
        } else {
          const mins = Math.floor(remaining / 60_000)
          const secs = Math.floor((remaining % 60_000) / 1000)
          lockoutMessage.value = `Too many attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}.`
        }
      }, 500)
    }

    const storedAuth = sessionStorage.getItem('yveyeh_admin_auth')
    const storedTs = sessionStorage.getItem('yveyeh_admin_auth_ts')
    if (storedAuth === 'true' && storedTs) {
      const elapsed = Date.now() - parseInt(storedTs, 10)
      if (elapsed < SESSION_TIMEOUT_MS) {
        isAuthenticated.value = true
      } else {
        sessionStorage.removeItem('yveyeh_admin_auth')
        sessionStorage.removeItem('yveyeh_admin_auth_ts')
        sessionStorage.removeItem('yveyeh_admin_token')
      }
    }

    const checkPasscode = async () => {
      if (lockoutUntil.value > Date.now()) return

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: passcode.value }),
        })
        const data = await res.json()
        if (res.ok && data.authenticated) {
          isAuthenticated.value = true
          sessionStorage.setItem('yveyeh_admin_auth', 'true')
          sessionStorage.setItem('yveyeh_admin_auth_ts', Date.now().toString())
          if (data.token) sessionStorage.setItem('yveyeh_admin_token', data.token)
          authError.value = ''
          failedAttempts.value = 0
          lockoutUntil.value = 0
          lockoutMessage.value = ''
          if (lockoutTimer) {
            clearInterval(lockoutTimer)
            lockoutTimer = null
          }
          fetchBackendHealth()
          return
        } else if (res.status === 429 || data.lockedOut) {
          lockoutUntil.value = Date.now() + (data.remainingSeconds || 900) * 1000
          authError.value = ''
          startLockoutCountdown()
          return
        } else {
          authError.value = data.error || 'Invalid passcode.'
          return
        }
      } catch {
        // Fallback if backend is starting up
        const hash = await hashString(passcode.value)
        if (hash === PASSCODE_HASH) {
          isAuthenticated.value = true
          sessionStorage.setItem('yveyeh_admin_auth', 'true')
          sessionStorage.setItem('yveyeh_admin_auth_ts', Date.now().toString())
          authError.value = ''
          failedAttempts.value = 0
        } else {
          failedAttempts.value++
          if (failedAttempts.value >= MAX_FAILED_ATTEMPTS) {
            lockoutUntil.value = Date.now() + LOCKOUT_DURATION_MS
            authError.value = ''
            startLockoutCountdown()
          } else {
            const remaining = MAX_FAILED_ATTEMPTS - failedAttempts.value
            authError.value = `Invalid passcode. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          }
        }
      }
    }

    const logout = async () => {
      const token = sessionStorage.getItem('yveyeh_admin_token')
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      }
      isAuthenticated.value = false
      sessionStorage.removeItem('yveyeh_admin_auth')
      sessionStorage.removeItem('yveyeh_admin_auth_ts')
      sessionStorage.removeItem('yveyeh_admin_token')
      passcode.value = ''
    }

    onMounted(() => {
      fetchBackendHealth()
      fetchPosts()
      fetchJobs()
    })

    onUnmounted(() => {
      if (lockoutTimer) clearInterval(lockoutTimer)
    })

    // Current editing state
    const selectedPostId = ref<string | null>(null)
    const viewMode = ref<'split' | 'edit' | 'preview'>('split')
    const activeTab = ref<'editor' | 'jobs' | 'database'>('editor')
    const isSaving = ref(false)

    // Blog Post Form fields
    const form = ref({
      id: '',
      title: '',
      slug: '',
      category: 'DevSecOps',
      tags: '',
      summary: '',
      content: '',
      featured: false,
      readTime: '',
      date: '',
    })

    // Job Opportunity Form fields
    const selectedJobId = ref<string | null>(null)
    const jobForm = ref<{
      id: string
      title: string
      company: string
      location: string
      workplaceType: WorkplaceType
      employmentType: EmploymentType
      salaryRange: string
      referralLink: string
      description: string
      tags: string
      featured: boolean
    }>({
      id: '',
      title: '',
      company: '',
      location: 'Remote',
      workplaceType: 'remote',
      employmentType: 'full-time',
      salaryRange: '',
      referralLink: '',
      description: '',
      tags: 'Kubernetes, DevSecOps, Cloud',
      featured: false,
    })

    const statusMessage = ref('')
    const isError = ref(false)
    const setStatus = (msg: string, err = false) => {
      statusMessage.value = msg
      isError.value = err
      setTimeout(() => {
        statusMessage.value = ''
      }, 4000)
    }

    const selectPost = (post: BlogPost) => {
      selectedPostId.value = post.id
      form.value = {
        id: post.id,
        title: post.title || '',
        slug: post.slug || '',
        category: post.category || 'DevSecOps',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
        summary: post.summary || '',
        content: post.content || '',
        featured: !!post.featured,
        readTime: post.readTime || '',
        date: post.date || new Date().toISOString().split('T')[0],
      }
    }

    const createNewPost = () => {
      selectedPostId.value = null
      form.value = {
        id: '',
        title: '',
        slug: '',
        category: 'DevSecOps',
        tags: '',
        summary: '',
        content: `# New Article Title\n\nWrite your technical insights, architectural diagrams, and code snippets here...\n`,
        featured: false,
        readTime: '5 min read',
        date: new Date().toISOString().split('T')[0],
      }
    }

    if (posts.value && posts.value.length) {
      selectPost(posts.value[0])
    }

    watch(posts, (newPosts) => {
      if (!selectedPostId.value && newPosts.length && !form.value.title) {
        selectPost(newPosts[0])
      }
    })

    const previewHtml = computed(() => {
      try {
        return marked.parse(form.value.content || '')
      } catch {
        return '<p class="text-red-400">Error parsing markdown preview</p>'
      }
    })

    // Save post to MySQL backend via Flask API
    const handleSave = async () => {
      if (!form.value.title.trim()) {
        setStatus('Article title is required', true)
        return
      }

      isSaving.value = true
      try {
        const postData: Partial<BlogPost> & { title: string; content: string } = {
          id: form.value.id || undefined,
          title: form.value.title.trim(),
          slug: form.value.slug.trim(),
          category: form.value.category.trim(),
          tags: form.value.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          summary: form.value.summary.trim(),
          content: form.value.content,
          featured: form.value.featured,
          readTime: form.value.readTime || '5 min read',
          date: form.value.date || new Date().toISOString().split('T')[0],
        }

        const saved = await savePost(postData)
        selectedPostId.value = saved.id
        form.value.id = saved.id
        form.value.slug = saved.slug
        setStatus(`✓ Saved "${saved.title}" to MySQL database!`)
      } catch (err: any) {
        setStatus(err.message || 'Failed to save article', true)
      } finally {
        isSaving.value = false
      }
    }

    const handleDelete = async (id: string) => {
      if (!id) return
      if (!confirm('Are you sure you want to delete this post from the MySQL database?')) return
      try {
        await deletePost(id)
        setStatus('Post removed from database')
        if (posts.value.length) {
          selectPost(posts.value[0])
        } else {
          createNewPost()
        }
      } catch (err: any) {
        setStatus(err.message || 'Delete failed', true)
      }
    }

    const handleResetPosts = async () => {
      if (!confirm('Reset articles in MySQL database back to seed posts?')) return
      await resetPosts()
      if (posts.value.length) selectPost(posts.value[0])
      setStatus('✓ Reset articles in MySQL database')
    }

    const downloadMarkdown = () => {
      if (!form.value.title) {
        setStatus('No post to download', true)
        return
      }
      const filename = `${form.value.slug || 'article'}.md`
      const frontmatter = `---
title: "${form.value.title}"
date: "${form.value.date}"
category: "${form.value.category}"
tags: [${form.value.tags}]
summary: "${form.value.summary}"
readTime: "${form.value.readTime}"
featured: ${form.value.featured}
author:
  name: "Didier Yufenyuy Veyeh"
  title: "DevSecOps Solutions Architect"
  avatar: "/assets/img/didier-headshot.jpg"
---

`
      const blob = new Blob([frontmatter + form.value.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setStatus(`Downloaded ${filename}`)
    }

    // --- Job Opportunities Management ---
    const selectJob = (job: TechJob) => {
      selectedJobId.value = job.id
      jobForm.value = {
        id: job.id,
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        workplaceType: job.workplaceType || 'remote',
        employmentType: job.employmentType || 'full-time',
        salaryRange: job.salaryRange || '',
        referralLink: job.referralLink || '',
        description: job.description || '',
        tags: Array.isArray(job.tags) ? job.tags.join(', ') : '',
        featured: !!job.featured,
      }
    }

    const createNewJob = () => {
      selectedJobId.value = null
      jobForm.value = {
        id: '',
        title: '',
        company: '',
        location: 'Remote',
        workplaceType: 'remote',
        employmentType: 'full-time',
        salaryRange: '',
        referralLink: '',
        description: '',
        tags: 'Kubernetes, DevSecOps, Cloud',
        featured: false,
      }
    }

    if (jobs.value && jobs.value.length) {
      selectJob(jobs.value[0])
    }

    watch(jobs, (newJobs) => {
      if (!selectedJobId.value && newJobs.length && !jobForm.value.title) {
        selectJob(newJobs[0])
      }
    })

    const handleSaveJob = async () => {
      if (!jobForm.value.title.trim() || !jobForm.value.company.trim()) {
        setStatus('Job title and company name are required', true)
        return
      }
      if (!jobForm.value.referralLink.trim()) {
        setStatus('Referral link is required so applicants can open it on click', true)
        return
      }

      isSaving.value = true
      try {
        const jobPayload = {
          title: jobForm.value.title.trim(),
          company: jobForm.value.company.trim(),
          location: jobForm.value.location.trim() || 'Remote',
          workplaceType: jobForm.value.workplaceType,
          employmentType: jobForm.value.employmentType,
          salaryRange: jobForm.value.salaryRange.trim() || undefined,
          referralLink: jobForm.value.referralLink.trim(),
          description: jobForm.value.description.trim(),
          tags: jobForm.value.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          featured: jobForm.value.featured,
        }

        if (selectedJobId.value) {
          await updateJob(selectedJobId.value, jobPayload)
          setStatus(`✓ Updated job "${jobPayload.title}" in MySQL database!`)
        } else {
          const created = await addJob(jobPayload)
          selectedJobId.value = created.id
          jobForm.value.id = created.id
          setStatus(`✓ Published new job "${created.title}" to MySQL database!`)
        }
        fetchBackendHealth()
      } catch (err: any) {
        setStatus(err.message || 'Failed to save job opportunity', true)
      } finally {
        isSaving.value = false
      }
    }

    const handleDeleteJob = async (id: string) => {
      if (!confirm('Are you sure you want to remove this job opportunity from the MySQL database?')) return
      try {
        await deleteJob(id)
        setStatus('Job opportunity removed from database')
        fetchBackendHealth()
        if (jobs.value.length) {
          selectJob(jobs.value[0])
        } else {
          createNewJob()
        }
      } catch (err: any) {
        setStatus(err.message || 'Failed to delete job', true)
      }
    }

    const handleResetJobs = async () => {
      if (!confirm('Reset job opportunities in MySQL database back to initial seed jobs?')) return
      await resetJobs()
      fetchBackendHealth()
      if (jobs.value.length) selectJob(jobs.value[0])
      setStatus('✓ Reset jobs in MySQL database')
    }

    const refreshDatabase = async () => {
      await Promise.all([fetchBackendHealth(), fetchPosts(), fetchJobs()])
      setStatus('✓ Synced latest records from Flask + MySQL backend')
    }

    const testReferralLink = () => {
      if (jobForm.value.referralLink) {
        window.open(jobForm.value.referralLink, '_blank', 'noopener,noreferrer')
      } else {
        setStatus('Enter a referral link to test', true)
      }
    }

    return {
      posts,
      backendConnected,
      backendHealth,
      refreshDatabase,
      handleResetPosts,
      isAuthenticated,
      passcode,
      authError,
      failedAttempts,
      lockoutUntil,
      lockoutMessage,
      checkPasscode,
      logout,
      selectedPostId,
      viewMode,
      activeTab,
      isSaving,
      form,
      statusMessage,
      isError,
      selectPost,
      createNewPost,
      previewHtml,
      handleSave,
      handleDelete,
      downloadMarkdown,
      jobs,
      selectedJobId,
      jobForm,
      selectJob,
      createNewJob,
      handleSaveJob,
      handleDeleteJob,
      handleResetJobs,
      testReferralLink,
    }
  },
})
