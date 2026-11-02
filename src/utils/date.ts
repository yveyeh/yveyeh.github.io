/**
 * Format timestamp or ISO date string into live relative time ("Just now", "5m ago", "2h ago", "3d ago")
 * or clean formatted date string for older items.
 */
export function formatRelativeTime(dateOrTimestamp: string | number | undefined): string {
  if (!dateOrTimestamp) return 'Just now'

  const timestamp = typeof dateOrTimestamp === 'number'
    ? dateOrTimestamp
    : Date.parse(dateOrTimestamp)

  // Fallback for legacy relative strings already in storage (e.g. "2 days ago")
  if (isNaN(timestamp)) {
    return dateOrTimestamp.toString()
  }

  const diffMs = Date.now() - timestamp
  if (diffMs < 0) return 'Just now'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'Just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format date for jobs or posts (e.g. "Oct 29, 2026")
 */
export function formatDate(dateString: string): string {
  const parsed = Date.parse(dateString)
  if (isNaN(parsed)) return dateString

  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
