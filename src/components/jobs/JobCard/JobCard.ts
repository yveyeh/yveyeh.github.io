import template from './JobCard.html?raw'
import { defineComponent, computed, type PropType } from 'vue'
import type { TechJob } from '../../../types/job'
import { formatRelativeTime } from '../../../utils/date'

export default defineComponent({
  name: 'JobCard',
  template,
  props: {
    job: {
      type: Object as PropType<TechJob>,
      required: true,
    },
  },
  setup(props) {
    const formattedDate = computed(() => formatRelativeTime(props.job.datePosted))

    const workplaceBadgeClass = computed(() => {
      switch (props.job.workplaceType) {
        case 'remote':
          return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        case 'hybrid':
          return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
        case 'in-office':
          return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
        default:
          return 'bg-white/10 text-white/80 border-white/20'
      }
    })

    const employmentBadgeClass = computed(() => {
      switch (props.job.employmentType) {
        case 'full-time':
          return 'bg-gold-400/15 text-gold-300 border-gold-400/30'
        case 'contract':
          return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        case 'part-time':
          return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
        default:
          return 'bg-white/10 text-white/80 border-white/20'
      }
    })

    const openReferral = () => {
      if (props.job.referralLink) {
        window.open(props.job.referralLink, '_blank', 'noopener,noreferrer')
      }
    }

    return {
      formattedDate,
      workplaceBadgeClass,
      employmentBadgeClass,
      openReferral,
    }
  },
})
