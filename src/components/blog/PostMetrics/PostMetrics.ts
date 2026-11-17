import template from './PostMetrics.html?raw'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PostMetrics',
  template,
  props: {
    views: { type: Number, required: true },
    shares: { type: Number, required: true },
    commentsCount: { type: Number, required: true },
    readTime: { type: String, required: true },
  },
})
