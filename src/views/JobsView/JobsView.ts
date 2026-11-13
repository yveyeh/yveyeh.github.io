import template from './JobsView.html?raw'
import { defineComponent, ref, computed } from 'vue'
import { useJobStore } from '../../data/jobStore'
import type { WorkplaceType, EmploymentType } from '../../types/job'
import AppsLauncher from '../../components/AppsLauncher/AppsLauncher'
import JobCard from '../../components/jobs/JobCard/JobCard'

export default defineComponent({
  name: 'JobsView',
  template,
  components: {
    AppsLauncher,
    JobCard,
  },
  setup() {
    const { jobs } = useJobStore()
    const allJobs = computed(() => jobs.value)

    const searchQuery = ref('')
    const selectedWorkplace = ref<WorkplaceType | 'all'>('all')
    const selectedEmployment = ref<EmploymentType | 'all'>('all')

    const workplaceCategories: Array<{ value: WorkplaceType | 'all'; label: string }> = [
      { value: 'all', label: 'All Locations' },
      { value: 'remote', label: 'Remote' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'in-office', label: 'In-Office' },
    ]

    const employmentCategories: Array<{ value: EmploymentType | 'all'; label: string }> = [
      { value: 'all', label: 'All Types' },
      { value: 'full-time', label: 'Full-Time' },
      { value: 'contract', label: 'Contract' },
      { value: 'part-time', label: 'Part-Time' },
    ]

    const filteredJobs = computed(() => {
      const q = searchQuery.value.trim().toLowerCase()
      return allJobs.value.filter((job) => {
        if (selectedWorkplace.value !== 'all' && job.workplaceType !== selectedWorkplace.value) return false
        if (selectedEmployment.value !== 'all' && job.employmentType !== selectedEmployment.value) return false
        if (q) {
          const matchTitle = (job.title || '').toLowerCase().includes(q)
          const matchCompany = (job.company || '').toLowerCase().includes(q)
          const matchLocation = (job.location || '').toLowerCase().includes(q)
          const matchDesc = (job.description || '').toLowerCase().includes(q)
          const matchTags = (job.tags || []).some((t) => t.toLowerCase().includes(q))
          if (!matchTitle && !matchCompany && !matchLocation && !matchDesc && !matchTags) return false
        }
        return true
      })
    })

    const isFiltering = computed(
      () => searchQuery.value.trim() !== '' || selectedWorkplace.value !== 'all' || selectedEmployment.value !== 'all'
    )

    const featuredJob = computed(() => {
      return filteredJobs.value.find((j) => j.featured) || filteredJobs.value[0] || null
    })

    const isFeaturedBannerVisible = computed(() => {
      return Boolean(featuredJob.value && !isFiltering.value)
    })

    const displayJobs = computed(() => {
      if (isFeaturedBannerVisible.value && featuredJob.value) {
        return filteredJobs.value.filter((j) => j.id !== featuredJob.value?.id)
      }
      return filteredJobs.value
    })

    const resetFilters = () => {
      searchQuery.value = ''
      selectedWorkplace.value = 'all'
      selectedEmployment.value = 'all'
    }

    const openReferral = (url?: string) => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }

    return {
      allJobs,
      searchQuery,
      selectedWorkplace,
      selectedEmployment,
      workplaceCategories,
      employmentCategories,
      filteredJobs,
      featuredJob,
      isFeaturedBannerVisible,
      displayJobs,
      isFiltering,
      resetFilters,
      openReferral,
    }
  },
})
