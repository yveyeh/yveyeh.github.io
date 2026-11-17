import { computed } from 'vue'
import store from '../store'
import type { TechJob } from '../types/job'

const CHANNEL_NAME = 'yveyeh_jobs_broadcast_channel'
let channel: BroadcastChannel | null = null
let initialized = false

function broadcastUpdate() {
  if (channel) {
    try {
      channel.postMessage({ type: 'JOBS_UPDATED' })
    } catch {}
  }
}

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (event) => {
      if (event.data?.type === 'JOBS_UPDATED') {
        store.dispatch('fetchJobs')
      }
    }
  } catch {}
}

export function useJobStore() {
  if (!initialized) {
    initialized = true
    store.dispatch('fetchJobs')
  }

  const jobs = computed<TechJob[]>(() => store.state.jobs)
  const isLoading = computed<boolean>(() => store.state.isLoadingJobs)

  const fetchJobs = (): Promise<TechJob[]> => store.dispatch('fetchJobs')
  const getJobs = (): TechJob[] => store.getters.allJobs
  const getJobById = (id: string): TechJob | undefined => store.getters.jobById(id)

  const addJob = async (jobData: Omit<TechJob, 'id' | 'datePosted'>): Promise<TechJob> => {
    const created: TechJob = await store.dispatch('addJob', jobData)
    broadcastUpdate()
    return created
  }

  const updateJob = async (id: string, updatedFields: Partial<TechJob>): Promise<boolean> => {
    const ok: boolean = await store.dispatch('updateJob', { id, updatedFields })
    broadcastUpdate()
    return ok
  }

  const deleteJob = async (id: string): Promise<void> => {
    await store.dispatch('deleteJob', id)
    broadcastUpdate()
  }

  const resetJobs = async (): Promise<void> => {
    await store.dispatch('resetJobs')
    broadcastUpdate()
  }

  return {
    jobs,
    isLoading,
    fetchJobs,
    getJobs,
    getJobById,
    addJob,
    updateJob,
    deleteJob,
    resetJobs,
  }
}
