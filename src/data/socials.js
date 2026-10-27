import {
  faGithub,
  faStackOverflow,
  faSkype,
  faLinkedinIn,
  faXTwitter,
  faFacebookF,
  faWhatsapp,
  faInstagram,
  faWordpress,
} from '@fortawesome/free-brands-svg-icons'

/**
 * Social handles & platforms shown in the apps-launcher pane (top-right).
 * Exactly 9 items to match the 3x3 nine-dot launcher grid.
 */
export const socials = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/yveyeh', icon: faGithub, bg: 'bg-neutral-900' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/yufenyuy-veyeh-a-didier-a66219ab/', icon: faLinkedinIn, bg: 'bg-[#0a66c2]' },
  { id: 'blog', label: 'Blog', href: 'https://yveyeh.wordpress.com', icon: faWordpress, bg: 'bg-[#21759b]' },
  { id: 'stackoverflow', label: 'Stack Overflow', href: 'https://stackoverflow.com/users/4389437/thunderbird?tab=profile', icon: faStackOverflow, bg: 'bg-[#f48024]' },
  { id: 'twitter', label: 'X / Twitter', href: 'https://twitter.com/yveyeh1', icon: faXTwitter, bg: 'bg-black' },
  { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/yufenyuyveyehaudigier.didier', icon: faFacebookF, bg: 'bg-[#1877f2]' },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/yveyeh/', icon: faInstagram, bg: 'bg-linear-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]' },
  { id: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/00237675007995/?text=Hello Didi...', icon: faWhatsapp, bg: 'bg-[#25d366]' },
  { id: 'skype', label: 'Skype', href: 'https://join.skype.com/invite/mN59RE8TKaJb', icon: faSkype, bg: 'bg-[#00aff0]' },
]
