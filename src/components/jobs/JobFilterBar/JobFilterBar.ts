import template from './JobFilterBar.html?raw'
import { defineComponent, type PropType } from 'vue'
import type { WorkplaceType, EmploymentType } from '../../../types/job'

export default defineComponent({
  name: 'JobFilterBar',
  template,
  props: {
    searchQuery: {
      type: String,
      required: true,
    },
    selectedWorkplace: {
      type: String as PropType<WorkplaceType | 'all'>,
      required: true,
    },
    selectedEmployment: {
      type: String as PropType<EmploymentType | 'all'>,
      required: true,
    },
    totalJobsCount: {
      type: Number,
      required: true,
    },
    filteredCount: {
      type: Number,
      required: true,
    },
  },
  emits: ['update:searchQuery', 'update:selectedWorkplace', 'update:selectedEmployment', 'reset'],
  setup(_, { emit }) {
    const workplaceOptions: Array<{ value: WorkplaceType | 'all'; label: string }> = [
      { value: 'all', label: 'All Locations' },
      { value: 'remote', label: 'Remote 🌐' },
      { value: 'hybrid', label: 'Hybrid 🏢' },
      { value: 'in-office', label: 'In-Office 📍' },
    ]

    const employmentOptions: Array<{ value: EmploymentType | 'all'; label: string }> = [
      { value: 'all', label: 'All Types' },
      { value: 'full-time', label: 'Full-time' },
      { value: 'contract', label: 'Contract' },
      { value: 'part-time', label: 'Part-time' },
    ]

    const onSearch = (e: Event) => {
      emit('update:searchQuery', (e.target as HTMLInputElement).value)
    }

    const setWorkplace = (val: WorkplaceType | 'all') => {
      emit('update:selectedWorkplace', val)
    }

    const setEmployment = (val: EmploymentType | 'all') => {
      emit('update:selectedEmployment', val)
    }

    const onReset = () => {
      emit('reset')
    }

    return {
      workplaceOptions,
      employmentOptions,
      onSearch,
      setWorkplace,
      setEmployment,
      onReset,
    }
  },
})
