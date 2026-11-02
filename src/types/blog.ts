export interface Author {
  name: string
  title: string
  avatar: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  summary: string
  category: string
  tags: string[]
  date: string
  readTime: string
  featured?: boolean
  author: Author
  content: string
}

export type ReactionType = 'fire' | 'smart' | 'rocket' | 'shield' | 'heart'

export interface ReactionsCount {
  fire: number
  smart: number
  rocket: number
  shield: number
  heart: number
}

export interface BlogComment {
  id: string
  authorName: string
  authorHandle?: string
  content: string
  createdAt: string
  avatarColor?: string
}

export interface PostInteractions {
  views: number
  shares: number
  reactions: ReactionsCount
  userReactions: Record<ReactionType, boolean>
  comments: BlogComment[]
}
