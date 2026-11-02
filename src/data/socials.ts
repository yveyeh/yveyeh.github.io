import {
  faGithub,
  faGitlab,
  faReddit,
  faPinterest,
  faYoutube,
  faLinkedinIn,
  faXTwitter,
  faWhatsapp,
  faInstagram,
  type IconDefinition
} from '@fortawesome/free-brands-svg-icons'

export interface SocialItem {
  id: string
  label: string
  href: string
  icon: IconDefinition
  bg: string
}

/**
 * Social handles & platforms shown in the apps-launcher pane (top-right).
 * Exactly 9 items to match the 3x3 nine-dot launcher grid.
 */
export const socials: SocialItem[] = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/yveyeh', icon: faGithub, bg: 'bg-neutral-900' },
  { id: 'gitlab', label: 'GitLab', href: 'https://gitlab.com/yveyeh', icon: faGitlab, bg: 'bg-[#fc6d26]' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/', icon: faLinkedinIn, bg: 'bg-[#0a66c2]' },
  { id: 'reddit', label: 'Reddit', href: '#', icon: faReddit, bg: 'bg-[#ff4500]' },
  { id: 'twitter', label: 'X / Twitter', href: 'https://twitter.com/yveyeh1', icon: faXTwitter, bg: 'bg-black' },
  { id: 'youtube', label: 'YouTube', href: '#', icon: faYoutube, bg: 'bg-[#ff0000]' },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/yveyeh/', icon: faInstagram, bg: 'bg-linear-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]' },
  { id: 'pinterest', label: 'Pinterest', href: '#', icon: faPinterest, bg: 'bg-[#ff0000]' },
  { id: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/00237675007995/?text=Hello Didi...', icon: faWhatsapp, bg: 'bg-[#25d366]' }
]
