import { ref } from 'vue'
import { initialPosts } from './posts'
import type { BlogPost } from '../types/blog'

const STORAGE_KEY = 'yveyeh_custom_blog_posts'
const GITHUB_CONFIG_KEY = 'yveyeh_github_admin_config'

export interface GitHubConfig {
  owner: string
  repo: string
  branch: string
  token: string
}

// Reactive state
const posts = ref<BlogPost[]>([])

function loadPosts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: BlogPost[] = JSON.parse(stored)
      // Ensure any newly added seed posts in initialPosts are merged seamlessly
      const existingIds = new Set(parsed.map((p) => p.slug || p.id))
      const newSeedPosts = (initialPosts as BlogPost[]).filter((p) => !existingIds.has(p.slug) && !existingIds.has(p.id))
      posts.value = [...newSeedPosts, ...parsed]
      return
    }
  } catch (err) {
    console.error('Failed to load posts from storage:', err)
  }
  // Fallback to initial seed posts
  posts.value = [...(initialPosts as BlogPost[])]
}

function persistPosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.value))
  } catch (err) {
    console.error('Failed to persist posts:', err)
  }
}

loadPosts()

export function useBlogStore() {
  const getPosts = () => posts.value

  const getPostBySlug = (slug: string) => {
    return posts.value.find((p) => p.slug === slug)
  }

  const savePost = (postData: Partial<BlogPost> & { title: string; content: string }) => {
    const existingIndex = posts.value.findIndex((p) => p.id === postData.id || p.slug === postData.slug)
    const normalized: BlogPost = {
      id: postData.id || `post-${Date.now()}`,
      slug: postData.slug || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: postData.title,
      summary: postData.summary || '',
      category: postData.category || 'DevSecOps',
      tags: postData.tags || [],
      date: postData.date || new Date().toISOString().split('T')[0],
      readTime: postData.readTime || `${Math.max(1, Math.round((postData.content || '').split(/\s+/).length / 200))} min read`,
      featured: postData.featured || false,
      author: postData.author || {
        name: 'Didier Yufenyuy Veyeh',
        title: 'DevSecOps Solutions Architect',
        avatar: '/assets/img/didier-headshot.jpg',
      },
      content: postData.content
    }

    if (existingIndex >= 0) {
      posts.value[existingIndex] = { ...posts.value[existingIndex], ...normalized }
    } else {
      posts.value.unshift(normalized)
    }
    persistPosts()
    return normalized
  }

  const deletePost = (idOrSlug: string) => {
    posts.value = posts.value.filter((p) => p.id !== idOrSlug && p.slug !== idOrSlug)
    persistPosts()
  }

  const resetPosts = () => {
    posts.value = [...(initialPosts as BlogPost[])]
    persistPosts()
  }

  // GitHub integration for in-browser commit
  const getGitHubConfig = (): GitHubConfig => {
    try {
      const saved = localStorage.getItem(GITHUB_CONFIG_KEY)
      return saved ? JSON.parse(saved) : { owner: 'yveyeh', repo: 'yveyeh.github.io', branch: 'dev', token: '' }
    } catch {
      return { owner: 'yveyeh', repo: 'yveyeh.github.io', branch: 'dev', token: '' }
    }
  }

  const saveGitHubConfig = (cfg: GitHubConfig) => {
    localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(cfg))
  }

  const publishToGitHub = async ({ token, owner = 'yveyeh', repo = 'yveyeh.github.io', branch = 'dev', post }: { token: string; owner?: string; repo?: string; branch?: string; post: BlogPost }) => {
    if (!token) throw new Error('GitHub Personal Access Token is required.')

    const filePath = `content/posts/${post.slug}.md`
    const frontmatter = `---
title: "${post.title.replace(/"/g, '\\"')}"
summary: "${post.summary.replace(/"/g, '\\"')}"
date: "${post.date}"
category: "${post.category}"
tags: [${(post.tags || []).map((t) => `"${t}"`).join(', ')}]
readTime: "${post.readTime}"
author:
  name: "${post.author?.name || 'Didier Yufenyuy Veyeh'}"
  title: "${post.author?.title || 'DevSecOps Solutions Architect'}"
---

${post.content}
`

    // Step 1: Check if file already exists to get its SHA
    let sha: string | null = null
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`
    try {
      const checkRes = await fetch(getUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })
      if (checkRes.ok) {
        const data = await checkRes.json()
        sha = data.sha
      }
    } catch {
      // file doesn't exist yet
    }

    // Step 2: Create or update file
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
    const utf8Bytes = new TextEncoder().encode(frontmatter)
    let binary = ''
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i])
    }
    const base64Content = btoa(binary)

    const payload: { message: string; content: string; branch: string; sha?: string } = {
      message: `docs(blog): publish article "${post.title}"`,
      content: base64Content,
      branch,
      ...(sha ? { sha } : {}),
    }

    const response = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || 'Failed to commit to GitHub')
    }

    return await response.json()
  }

  return {
    posts,
    getPosts,
    getPostBySlug,
    savePost,
    deletePost,
    resetPosts,
    getGitHubConfig,
    saveGitHubConfig,
    publishToGitHub,
  }
}
