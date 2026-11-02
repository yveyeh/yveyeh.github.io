import './HomeView.css'
import template from './HomeView.html?raw'
import { defineComponent, ref, onMounted } from 'vue'
import { faGithub, faGitlab } from '@fortawesome/free-brands-svg-icons'
import BrandIcon from '../../components/BrandIcon/BrandIcon'
import AppsLauncher from '../../components/AppsLauncher/AppsLauncher'

export default defineComponent({
  name: 'HomeView',
  template,
  components: {
    BrandIcon,
    AppsLauncher,
  },
  setup() {
    const typedPart1 = ref('')
    const typedName = ref('')
    const typedPart2 = ref('')
    const isTyping = ref(true)
    const showBadge = ref(false)

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    onMounted(async () => {
      await sleep(400)

      const part1 = "I'm"
      const fullName = "Didier Yufenyuy Veyeh"
      const part2 = ", but you can also call me"

      for (let i = 1; i <= part1.length; i++) {
        typedPart1.value = part1.slice(0, i)
        await sleep(45)
      }

      for (let i = 1; i <= fullName.length; i++) {
        typedName.value = fullName.slice(0, i)
        await sleep(50)
      }

      for (let i = 1; i <= part2.length; i++) {
        typedPart2.value = part2.slice(0, i)
        await sleep(40)
      }

      isTyping.value = false
      await sleep(150)
      showBadge.value = true
    })

    return {
      typedPart1,
      typedName,
      typedPart2,
      isTyping,
      showBadge,
      faGithub,
      faGitlab,
    }
  },
})
