import { computed, ref, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { useBlogStore } from '../data/blogStore'
import type { BlogPost } from '../types/blog'

export function useBlogPost() {
  const route = useRoute()
  const { getPostBySlug, getPosts } = useBlogStore()

  const slug = computed(() => String(route.params.slug || ''))
  const post = computed<BlogPost | undefined>(() => getPostBySlug(slug.value))
  const allPosts = computed<BlogPost[]>(() => getPosts())

  const recommendedPosts = computed(() => {
    return allPosts.value.filter((p) => p.slug !== slug.value).slice(0, 2)
  })

  const scrollProgress = ref(0)
  const onScroll = () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
    scrollProgress.value = height > 0 ? (winScroll / height) * 100 : 0
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
  })
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
  })

  const parsedContent = computed(() => {
    if (!post.value || !post.value.content) return ''
    return marked.parse(post.value.content)
  })

  watchEffect(() => {
    if (post.value) {
      document.title = `${post.value.title} | Didier Yufenyuy Veyeh`
      updateMetaTag('description', post.value.summary || '')
      updateOgTag('og:title', post.value.title)
      updateOgTag('og:description', post.value.summary || '')
    } else {
      document.title = 'DevSecOps & Cloud Engineering Blog | Didier Yufenyuy Veyeh'
    }
  })

  const copied = ref(false)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return {
    slug,
    post,
    recommendedPosts,
    scrollProgress,
    parsedContent,
    copied,
    copyLink
  }
}

function updateMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function updateOgTag(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}
