import template from './PostShareBar.html?raw'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'PostShareBar',
  template,
  props: {
    title: { type: String, required: true },
    shares: { type: Number, required: true },
  },
  emits: ['shared'],
  setup(props, { emit }) {
    const copied = ref(false)

    const share = async () => {
      const url = window.location.href
      emit('shared')
      if (navigator.share) {
        try {
          await navigator.share({ title: props.title, url })
          return
        } catch {}
      }
      try {
        await navigator.clipboard.writeText(url)
        copied.value = true
        setTimeout(() => (copied.value = false), 2000)
      } catch {}
    }

    return {
      copied,
      share,
    }
  },
})
