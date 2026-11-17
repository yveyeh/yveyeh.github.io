export type WorkplaceType = 'remote' | 'hybrid' | 'in-office'
export type EmploymentType = 'full-time' | 'part-time' | 'contract'

export interface TechJob {
  id: string
  title: string
  company: string
  location: string
  workplaceType: WorkplaceType
  employmentType: EmploymentType
  salaryRange?: string
  referralLink: string
  description: string
  tags: string[]
  datePosted: string // ISO date string
  featured?: boolean
}
