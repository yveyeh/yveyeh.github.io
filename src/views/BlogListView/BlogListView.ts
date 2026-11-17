import template from './BlogListView.html?raw'
import { defineComponent, ref, computed } from 'vue'
import { useBlogStore } from '../../data/blogStore'
import AppsLauncher from '../../components/AppsLauncher/AppsLauncher'
import PostCard from '../../components/blog/PostCard/PostCard'

export default defineComponent({
  name: 'BlogListView',
  template,
  components: {
    AppsLauncher,
    PostCard,
  },
  setup() {
    const { getPosts } = useBlogStore()
    const posts = computed(() => getPosts())

    const selectedCategory = ref('All')
    const searchQuery = ref('')

    const categories = computed(() => {
      const set = new Set<string>()
      posts.value.forEach((p) => {
        if (p.category) set.add(p.category)
      })
      return ['All', ...Array.from(set)]
    })

    const filteredPosts = computed(() => {
      const query = searchQuery.value.trim().toLowerCase()
      return posts.value.filter((p) => {
        const matchesCategory = selectedCategory.value === 'All' || p.category === selectedCategory.value
        if (!matchesCategory) return false

        if (!query) return true
        const titleMatch = (p.title || '').toLowerCase().includes(query)
        const summaryMatch = (p.summary || '').toLowerCase().includes(query)
        const tagMatch = (p.tags || []).some((t) => t.toLowerCase().includes(query))
        return titleMatch || summaryMatch || tagMatch
      })
    })

    const featuredPost = computed(() => {
      return filteredPosts.value.find((p) => p.featured) || filteredPosts.value[0] || null
    })

    const isFeaturedBannerVisible = computed(() => {
      return Boolean(featuredPost.value && !searchQuery.value.trim() && selectedCategory.value === 'All')
    })

    const displayPosts = computed(() => {
      if (isFeaturedBannerVisible.value && featuredPost.value) {
        return filteredPosts.value.filter((p) => p.id !== featuredPost.value.id)
      }
      return filteredPosts.value
    })

    return {
      posts,
      selectedCategory,
      searchQuery,
      categories,
      filteredPosts,
      featuredPost,
      isFeaturedBannerVisible,
      displayPosts,
    }
  },
})
