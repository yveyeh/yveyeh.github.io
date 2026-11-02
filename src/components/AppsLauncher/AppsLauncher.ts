import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'
import BrandIcon from '../BrandIcon/BrandIcon'
import { socials } from '../../data/socials'
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons'
import template from './AppsLauncher.html?raw'

export default defineComponent({
  name: 'AppsLauncher',
  template,
  components: {
    BrandIcon
  },
  setup() {
    const open = ref<boolean>(false)
    const root = ref<HTMLElement | null>(null)

    const toggle = (): void => {
      open.value = !open.value
    }

    const close = (): void => {
      open.value = false
    }

    const onPointerDown = (e: MouseEvent | TouchEvent): void => {
      if (open.value && root.value && !root.value.contains(e.target as Node)) {
        close()
      }
    }

    const onKeydown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        close()
      }
    }

    onMounted(() => {
      document.addEventListener('pointerdown', onPointerDown)
      document.addEventListener('keydown', onKeydown)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeydown)
    })

    return {
      open,
      root,
      socials,
      faCalendarCheck,
      toggle,
      close
    }
  }
})
