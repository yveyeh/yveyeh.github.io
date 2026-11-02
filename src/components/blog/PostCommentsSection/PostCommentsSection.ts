import template from './PostCommentsSection.html?raw'
import { defineComponent, type PropType } from 'vue'
import type { BlogComment } from '../../../types/blog'
import CommentItem from '../CommentItem/CommentItem'
import CommentForm from '../CommentForm/CommentForm'

export default defineComponent({
  name: 'PostCommentsSection',
  template,
  components: {
    CommentItem,
    CommentForm,
  },
  props: {
    comments: { type: Array as PropType<BlogComment[]>, required: true },
  },
  emits: ['add-comment'],
  setup(_, { emit }) {
    const onAddComment = (data: { name: string; content: string; handle?: string }) => {
      emit('add-comment', data)
    }

    return {
      onAddComment,
    }
  },
})
