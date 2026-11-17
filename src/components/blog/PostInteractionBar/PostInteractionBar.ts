import template from './PostInteractionBar.html?raw'
import { defineComponent, type PropType } from 'vue'
import type { ReactionsCount, ReactionType } from '../../../types/blog'
import PostReactions from '../PostReactions/PostReactions'
import PostShareBar from '../PostShareBar/PostShareBar'

export default defineComponent({
  name: 'PostInteractionBar',
  template,
  components: {
    PostReactions,
    PostShareBar,
  },
  props: {
    title: { type: String, required: true },
    shares: { type: Number, required: true },
    reactions: { type: Object as PropType<ReactionsCount>, required: true },
    userReactions: { type: Object as PropType<Record<ReactionType, boolean>>, required: true },
  },
  emits: ['react', 'shared'],
  setup(_, { emit }) {
    const onReact = (type: ReactionType) => emit('react', type)
    const onShared = () => emit('shared')

    return {
      onReact,
      onShared,
    }
  },
})
