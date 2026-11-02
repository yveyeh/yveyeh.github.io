import template from './CommentItem.html?raw'
import { defineComponent, computed, ref, onMounted, onBeforeUnmount, type PropType } from 'vue'
import type { BlogComment } from '../../../types/blog'
import { formatRelativeTime } from '../../../utils/date'

export default defineComponent({
  name: 'CommentItem',
  template,
  props: {
    comment: { type: Object as PropType<BlogComment>, required: true },
  },
  setup(props) {
    const now = ref(Date.now())
    let timer: number | null = null

    onMounted(() => {
      // Refresh relative time every 30s so "Just now" updates to "1m ago", etc.
      timer = window.setInterval(() => {
        now.value = Date.now()
      }, 30000)
    })

    onBeforeUnmount(() => {
      if (timer) clearInterval(timer)
    })

    const formattedTime = computed(() => {
      void now.value
      return formatRelativeTime(props.comment.createdAt)
    })

    return {
      formattedTime,
    }
  },
})
