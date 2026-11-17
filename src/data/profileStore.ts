import { computed } from 'vue'
import store from '../store'
import type { SocialItem } from './socials'

export interface SiteProfileData {
  name: string
  shortName: string
  nickname: string
  title: string
  shortTitle: string
  email: string
  avatar: string
  statusBadge: string
  bio: string
  githubUrl: string
  gitlabUrl: string
  bookingUrl: string
}

let initialized = false

export function useProfileStore() {
  if (!initialized) {
    initialized = true
    store.dispatch('fetchProfileAndSocials')
  }

  const profile = computed<SiteProfileData>(() => store.state.profile)
  const socialLinks = computed<SocialItem[]>(() => store.state.socials)
  const fetchProfileAndSocials = (): Promise<void> => store.dispatch('fetchProfileAndSocials')

  return {
    profile,
    socialLinks,
    fetchProfileAndSocials,
  }
}
