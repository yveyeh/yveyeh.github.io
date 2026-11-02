import template from './ReadingProgressBar.html?raw'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ReadingProgressBar',
  template,
  props: {
    progress: { type: Number, required: true },
  },
})
