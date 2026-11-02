import template from './PostReactions.html?raw'
import { defineComponent, type PropType } from 'vue'
import type { ReactionsCount, ReactionType } from '../../../types/blog'

export default defineComponent({
  name: 'PostReactions',
  template,
  props: {
    reactions: { type: Object as PropType<ReactionsCount>, required: true },
    userReactions: { type: Object as PropType<Record<ReactionType, boolean>>, required: true },
  },
  emits: ['react'],
  setup(_, { emit }) {
    const emojiConfig: Array<{ type: ReactionType; icon: string; label: string }> = [
      { type: 'fire', icon: '🔥', label: 'Insightful' },
      { type: 'smart', icon: '💡', label: 'Smart' },
      { type: 'rocket', icon: '🚀', label: 'Shipped' },
      { type: 'shield', icon: '🛡️', label: 'Secure' },
      { type: 'heart', icon: '❤️', label: 'Love' },
    ]

    const onReact = (type: ReactionType) => {
      emit('react', type)
    }

    return {
      emojiConfig,
      onReact,
    }
  },
})
