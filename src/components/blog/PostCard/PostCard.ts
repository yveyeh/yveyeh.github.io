import template from './PostCard.html?raw'
import { defineComponent, type PropType } from 'vue'
import type { BlogPost } from '../../../types/blog'

export default defineComponent({
  name: 'PostCard',
  template,
  props: {
    post: { type: Object as PropType<BlogPost>, required: true },
  },
})
