import template from './CommentForm.html?raw'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'CommentForm',
  template,
  emits: ['submit'],
  setup(_, { emit }) {
    const name = ref('')
    const handle = ref('')
    const content = ref('')

    const handleSubmit = () => {
      if (!name.value.trim() || !content.value.trim()) return
      emit('submit', { name: name.value, content: content.value, handle: handle.value })
      content.value = ''
    }

    return {
      name,
      handle,
      content,
      handleSubmit,
    }
  },
})
