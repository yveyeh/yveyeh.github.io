import template from './AdminStudioView.html?raw'
import { defineComponent, ref, computed, watch } from 'vue'
import { marked } from 'marked'
import { useBlogStore, type GitHubConfig } from '../../data/blogStore'
import { useJobStore } from '../../data/jobStore'
import type { BlogPost } from '../../types/blog'
import type { TechJob, WorkplaceType, EmploymentType } from '../../types/job'

export default defineComponent({
  name: 'AdminStudioView',
  template,
  setup() {
    const {
      posts,
      savePost,
      deletePost,
      resetPosts,
      getGitHubConfig,
      saveGitHubConfig,
      publishToGitHub,
    } = useBlogStore()

    const {
      jobs,
      addJob,
      updateJob,
      deleteJob,
      resetJobs,
    } = useJobStore()

    // Passcode gate
    const isAuthenticated = ref(false)
    const passcode = ref('')
    const authError = ref('')

    const storedAuth = sessionStorage.getItem('yveyeh_admin_auth')
    if (storedAuth === 'true') {
      isAuthenticated.value = true
    }

    const checkPasscode = () => {
      if (passcode.value === 'didi2026' || passcode.value === 'yveyeh') {
        isAuthenticated.value = true
        sessionStorage.setItem('yveyeh_admin_auth', 'true')
        authError.value = ''
      } else {
        authError.value = 'Invalid passcode. Default is "didi2026".'
      }
    }

    // Current editing state
    const selectedPostId = ref<string | null>(null)
    const viewMode = ref<'split' | 'edit' | 'preview'>('split')
    const activeTab = ref<'editor' | 'jobs' | 'settings' | 'github'>('editor')

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

    // Notification status
    const statusMessage = ref('')
    const isError = ref(false)
    const setStatus = (msg: string, err = false) => {
      statusMessage.value = msg
      isError.value = err
      setTimeout(() => {
        statusMessage.value = ''
      }, 4000)
    }

    // GitHub config
    const ghConfig = ref<GitHubConfig>(getGitHubConfig())
    const isPublishing = ref(false)

    const saveGhSettings = () => {
      saveGitHubConfig(ghConfig.value)
      setStatus('GitHub settings saved!')
    }

    // Select post to edit
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

    // Create new post
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

    // Initialize first post if exists
    if (posts.value && posts.value.length) {
      selectPost(posts.value[0])
    }

    // Markdown preview
    const previewHtml = computed(() => {
      try {
        return marked.parse(form.value.content || '')
      } catch (e) {
        return '<p class="text-red-400">Error parsing markdown preview</p>'
      }
    })

    // Save post locally
    const handleSave = () => {
      if (!form.value.title.trim()) {
        setStatus('Article title is required', true)
        return
      }

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

      const saved = savePost(postData)
      selectedPostId.value = saved.id
      form.value.id = saved.id
      form.value.slug = saved.slug
      setStatus(`✓ Saved "${saved.title}" to local store!`)
    }

    // Delete post
    const handleDelete = (id: string) => {
      if (!confirm('Are you sure you want to delete this post?')) return
      deletePost(id)
      setStatus('Post removed')
      if (posts.value.length) {
        selectPost(posts.value[0])
      } else {
        createNewPost()
      }
    }

    // Download markdown file
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

    // Publish to GitHub directly via API
    const handleGitHubPublish = async () => {
      if (!form.value.title.trim()) {
        setStatus('Please save the post before publishing', true)
        return
      }

      if (!ghConfig.value.token) {
        activeTab.value = 'github'
        setStatus('Please set your GitHub Personal Access Token first', true)
        return
      }

      handleSave()

      const postObj = posts.value.find((p) => p.id === form.value.id)
      if (!postObj) {
        setStatus('Post not found in store', true)
        return
      }

      isPublishing.value = true
      setStatus('Publishing directly to GitHub repo...')

      try {
        await publishToGitHub({
          token: ghConfig.value.token,
          post: postObj,
        })

        setStatus('✓ Successfully committed to GitHub! Deploy workflow triggered.')
      } catch (err: any) {
        setStatus(err.message || 'GitHub commit failed', true)
      } finally {
        isPublishing.value = false
      }
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

    // Init first job
    if (jobs.value && jobs.value.length) {
      selectJob(jobs.value[0])
    }

    const handleSaveJob = () => {
      if (!jobForm.value.title.trim() || !jobForm.value.company.trim()) {
        setStatus('Job title and company name are required', true)
        return
      }
      if (!jobForm.value.referralLink.trim()) {
        setStatus('Referral link is required so applicants can open it on click', true)
        return
      }

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
        updateJob(selectedJobId.value, jobPayload)
        setStatus(`✓ Updated job: "${jobPayload.title}"`)
      } else {
        const created = addJob(jobPayload)
        selectedJobId.value = created.id
        jobForm.value.id = created.id
        setStatus(`✓ Successfully posted new job: "${created.title}"!`)
      }
    }

    const handleDeleteJob = (id: string) => {
      if (!confirm('Are you sure you want to remove this job opportunity?')) return
      deleteJob(id)
      setStatus('Job opportunity removed')
      if (jobs.value.length) {
        selectJob(jobs.value[0])
      } else {
        createNewJob()
      }
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
      resetPosts,
      isAuthenticated,
      passcode,
      authError,
      checkPasscode,
      selectedPostId,
      viewMode,
      activeTab,
      form,
      statusMessage,
      isError,
      ghConfig,
      isPublishing,
      saveGhSettings,
      selectPost,
      createNewPost,
      previewHtml,
      handleSave,
      handleDelete,
      downloadMarkdown,
      handleGitHubPublish,
      // Jobs management
      jobs,
      selectedJobId,
      jobForm,
      selectJob,
      createNewJob,
      handleSaveJob,
      handleDeleteJob,
      resetJobs,
      testReferralLink,
    }
  },
})
