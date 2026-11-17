import template from './RecommendedCard.html?raw'
import { defineComponent, type PropType } from 'vue'
import type { BlogPost } from '../../../types/blog'

export default defineComponent({
  name: 'RecommendedCard',
  template,
  props: {
    post: { type: Object as PropType<BlogPost>, required: true },
  },
})
