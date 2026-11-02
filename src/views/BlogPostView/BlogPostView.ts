import './BlogPostView.css'
import template from './BlogPostView.html?raw'
import { defineComponent, watch, onMounted } from 'vue'
import { useBlogPost } from '../../composables/useBlogPost'
import { useBlogInteractions } from '../../composables/useBlogInteractions'
import AppsLauncher from '../../components/AppsLauncher/AppsLauncher'
import ReadingProgressBar from '../../components/blog/ReadingProgressBar/ReadingProgressBar'
import ArticleHeader from '../../components/blog/ArticleHeader/ArticleHeader'
import PostMetrics from '../../components/blog/PostMetrics/PostMetrics'
import PostInteractionBar from '../../components/blog/PostInteractionBar/PostInteractionBar'
import AuthorBioCard from '../../components/blog/AuthorBioCard/AuthorBioCard'
import PostCommentsSection from '../../components/blog/PostCommentsSection/PostCommentsSection'
import RecommendedCard from '../../components/blog/RecommendedCard/RecommendedCard'

export default defineComponent({
  name: 'BlogPostView',
  template,
  components: {
    AppsLauncher,
    ReadingProgressBar,
    ArticleHeader,
    PostMetrics,
    PostInteractionBar,
    AuthorBioCard,
    PostCommentsSection,
    RecommendedCard,
  },
  setup() {
    const { slug, post, recommendedPosts, scrollProgress, parsedContent, copied, copyLink } = useBlogPost()
    const { interactions, trackView, trackShare, toggleReaction, addComment } = useBlogInteractions(slug.value)

    onMounted(() => {
      if (post.value) trackView()
    })

    watch(slug, (newSlug) => {
      if (newSlug) trackView()
    })

    return {
      slug,
      post,
      recommendedPosts,
      scrollProgress,
      parsedContent,
      copied,
      copyLink,
      interactions,
      trackShare,
      toggleReaction,
      addComment,
    }
  },
})
