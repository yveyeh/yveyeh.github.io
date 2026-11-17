import { defineComponent, computed, type PropType } from 'vue'
import type { IconDefinition } from '@fortawesome/free-brands-svg-icons'
import template from './BrandIcon.html?raw'

export default defineComponent({
  name: 'BrandIcon',
  template,
  props: {
    icon: {
      type: Object as PropType<IconDefinition>,
      required: true
    }
  },
  setup(props) {
    const viewBox = computed<string>(() => {
      if (!props.icon || !props.icon.icon) return '0 0 512 512'
      const [width, height] = props.icon.icon
      return `0 0 ${width} ${height}`
    })

    const pathData = computed<string>(() => {
      if (!props.icon || !props.icon.icon) return ''
      const [, , , , path] = props.icon.icon
      return Array.isArray(path) ? path.join(' ') : (path as string)
    })

    return {
      viewBox,
      pathData
    }
  }
})
