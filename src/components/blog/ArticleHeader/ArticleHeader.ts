import template from './ArticleHeader.html?raw'
import { defineComponent, type PropType } from 'vue'
import type { BlogPost } from '../../../types/blog'

export default defineComponent({
  name: 'ArticleHeader',
  template,
  props: {
    post: { type: Object as PropType<BlogPost>, required: true },
  },
})
