import template from './JobsView.html?raw'
import { defineComponent, ref, computed } from 'vue'
import { useJobStore } from '../../data/jobStore'
import type { WorkplaceType, EmploymentType } from '../../types/job'
import AppsLauncher from '../../components/AppsLauncher/AppsLauncher'
import JobCard from '../../components/jobs/JobCard/JobCard'
import JobFilterBar from '../../components/jobs/JobFilterBar/JobFilterBar'

export default defineComponent({
  name: 'JobsView',
  template,
  components: {
    AppsLauncher,
    JobCard,
    JobFilterBar,
  },
  setup() {
    const { getJobs } = useJobStore()
    const allJobs = computed(() => getJobs())

    const searchQuery = ref('')
    const selectedWorkplace = ref<WorkplaceType | 'all'>('all')
    const selectedEmployment = ref<EmploymentType | 'all'>('all')

    const filteredJobs = computed(() => {
      const q = searchQuery.value.trim().toLowerCase()
      return allJobs.value.filter((job) => {
        // Workplace filter
        if (selectedWorkplace.value !== 'all' && job.workplaceType !== selectedWorkplace.value) {
          return false
        }
        // Employment filter
        if (selectedEmployment.value !== 'all' && job.employmentType !== selectedEmployment.value) {
          return false
        }
        // Search query filter
        if (q) {
          const matchTitle = job.title.toLowerCase().includes(q)
          const matchCompany = job.company.toLowerCase().includes(q)
          const matchLocation = job.location.toLowerCase().includes(q)
          const matchDesc = job.description.toLowerCase().includes(q)
          const matchTags = job.tags.some((t) => t.toLowerCase().includes(q))
          if (!matchTitle && !matchCompany && !matchLocation && !matchDesc && !matchTags) {
            return false
          }
        }
        return true
      })
    })

    const resetFilters = () => {
      searchQuery.value = ''
      selectedWorkplace.value = 'all'
      selectedEmployment.value = 'all'
    }

    return {
      allJobs,
      searchQuery,
      selectedWorkplace,
      selectedEmployment,
      filteredJobs,
      resetFilters,
    }
  },
})
