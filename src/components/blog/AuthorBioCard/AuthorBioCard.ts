import template from './AuthorBioCard.html?raw'
import { defineComponent, type PropType } from 'vue'
import type { Author } from '../../../types/blog'

export default defineComponent({
  name: 'AuthorBioCard',
  template,
  props: {
    author: { type: Object as PropType<Author>, default: undefined },
  },
})
