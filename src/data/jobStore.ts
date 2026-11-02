import { ref } from 'vue'
import type { TechJob } from '../types/job'

const STORAGE_KEY = 'yveyeh_tech_jobs_data'
const CHANNEL_NAME = 'yveyeh_jobs_broadcast_channel'

const initialJobs: TechJob[] = [
  {
    id: 'job-lead-devsecops-architect',
    title: 'Lead DevSecOps Architect',
    company: 'CloudNative Security Corp',
    location: 'Remote (Global / EMEA)',
    workplaceType: 'remote',
    employmentType: 'full-time',
    salaryRange: '$165,000 - $210,000 USD',
    referralLink: 'https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/',
    description: 'Spearhead zero-trust cloud infrastructure, automated supply-chain verification (Cosign/Sigstore), ephemeral OIDC credentials, and GitOps policy enforcement across multi-tenant Kubernetes clusters.',
    tags: ['DevSecOps', 'Kubernetes', 'Cosign', 'Kyverno', 'Terraform', 'AWS'],
    datePosted: '2026-10-24T10:00:00.000Z',
    featured: true
  },
  {
    id: 'job-senior-cloud-platform-engineer',
    title: 'Senior Cloud Platform Engineer',
    company: 'FinTech Velocity',
    location: 'London, UK (Hybrid - 1 day/wk)',
    workplaceType: 'hybrid',
    employmentType: 'full-time',
    salaryRange: '£95,000 - £125,000 GBP',
    referralLink: 'https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/',
    description: 'Design and operate high-throughput OpenTofu infrastructure, HashiCorp Vault operator secrets pipelines, and automated blue/green delivery mechanisms for distributed banking microservices.',
    tags: ['Terraform', 'OpenTofu', 'Vault', 'Kubernetes', 'GCP', 'Golang'],
    datePosted: '2026-10-22T08:30:00.000Z',
    featured: true
  },
  {
    id: 'job-staff-sre-observability',
    title: 'Staff Site Reliability Engineer (Observability)',
    company: 'DataStream Global',
    location: 'Berlin / Amsterdam / Remote',
    workplaceType: 'remote',
    employmentType: 'full-time',
    salaryRange: '€110,000 - €140,000 EUR',
    referralLink: 'https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/',
    description: 'Own enterprise SLIs/SLOs, OpenTelemetry distributed tracing, Prometheus federation, and chaos engineering practices for a multi-region stream processing platform.',
    tags: ['SRE', 'OpenTelemetry', 'Prometheus', 'Grafana', 'Kafka', 'eBPF'],
    datePosted: '2026-10-20T14:15:00.000Z',
    featured: false
  },
  {
    id: 'job-kubernetes-security-specialist-contract',
    title: 'Kubernetes & Hardening Specialist',
    company: 'Apex Threat Defense',
    location: 'Remote (US / Canada / LatAm)',
    workplaceType: 'remote',
    employmentType: 'contract',
    salaryRange: '$90 - $125 / hour',
    referralLink: 'https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/',
    description: 'Conduct CIS benchmark cluster hardening, implement eBPF runtime security with Cilium and Falco, and eliminate privileged container runtimes for enterprise clients.',
    tags: ['Kubernetes', 'Cilium', 'Falco', 'eBPF', 'Trivy', 'Security Audits'],
    datePosted: '2026-10-18T11:45:00.000Z',
    featured: false
  },
  {
    id: 'job-cloud-infrastructure-lead',
    title: 'Cloud Infrastructure & Automation Lead',
    company: 'ScaleX Digital Labs',
    location: 'Paris, France (In-office / Hybrid)',
    workplaceType: 'in-office',
    employmentType: 'full-time',
    salaryRange: '€85,000 - €110,000 EUR',
    referralLink: 'https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/',
    description: 'Lead a team of 6 engineers automating multi-cloud Landing Zones, cost optimization policies, and self-service internal developer platforms (IDP) using Backstage and Crossplane.',
    tags: ['Crossplane', 'Backstage', 'AWS', 'Azure', 'Docker', 'CI/CD'],
    datePosted: '2026-10-15T09:00:00.000Z',
    featured: false
  }
]

let channel: BroadcastChannel | null = null

export function useJobStore() {
  const jobs = ref<TechJob[]>([])

  const loadJobs = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as TechJob[]
        // Merge with initial jobs to ensure seed jobs exist
        const storedIds = new Set(parsed.map(j => j.id))
        const missingSeedJobs = initialJobs.filter(j => !storedIds.has(j.id))
        jobs.value = [...parsed, ...missingSeedJobs]
        return
      }
    } catch (e) {
      console.error('Failed to load tech jobs from storage:', e)
    }
    jobs.value = [...initialJobs]
  }

  const persist = (broadcast = true) => {
    try {
      const serialized = JSON.stringify(jobs.value)
      localStorage.setItem(STORAGE_KEY, serialized)
      if (broadcast && channel) {
        channel.postMessage({ type: 'JOBS_UPDATED', payload: serialized })
      }
    } catch (e) {
      console.error('Failed to persist jobs:', e)
    }
  }

  // Setup Realtime Sync
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      if (!channel) {
        channel = new BroadcastChannel(CHANNEL_NAME)
        channel.onmessage = (event) => {
          if (event.data?.type === 'JOBS_UPDATED' && event.data.payload) {
            try {
              jobs.value = JSON.parse(event.data.payload)
            } catch (e) {
              console.error('Error handling jobs broadcast sync:', e)
            }
          }
        }
      }
    } catch {}

    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          jobs.value = JSON.parse(event.newValue)
        } catch {}
      }
    })
  }

  loadJobs()

  const getJobs = () => jobs.value

  const getJobById = (id: string) => jobs.value.find(j => j.id === id)

  const addJob = (jobData: Omit<TechJob, 'id' | 'datePosted'>) => {
    const newJob: TechJob = {
      ...jobData,
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      datePosted: new Date().toISOString()
    }
    jobs.value.unshift(newJob)
    persist()
    return newJob
  }

  const updateJob = (id: string, updatedFields: Partial<TechJob>) => {
    const index = jobs.value.findIndex(j => j.id === id)
    if (index !== -1) {
      jobs.value[index] = { ...jobs.value[index], ...updatedFields }
      persist()
      return true
    }
    return false
  }

  const deleteJob = (id: string) => {
    jobs.value = jobs.value.filter(j => j.id !== id)
    persist()
  }

  const resetJobs = () => {
    jobs.value = [...initialJobs]
    persist()
  }

  return {
    jobs,
    getJobs,
    getJobById,
    addJob,
    updateJob,
    deleteJob,
    resetJobs
  }
}
