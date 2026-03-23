import prisma from '../db'

export interface DigestBookmark {
  id: number
  url: string
  title: string
  savedCount: number
  savedBy: string
}

export interface DigestResult {
  generatedAt: string
  bookmarks: DigestBookmark[]
}

/**
 * Builds the weekly digest for a user: top 5 most-saved bookmarks
 * from people they follow, created in the last 7 days.
 */
export async function buildDigest(userId: number): Promise<DigestResult> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      user: {
        followers: { some: { followerId: userId } },
      },
    },
    include: {
      user: { select: { username: true } },
    },
    orderBy: { savedCount: 'desc' },
    take: 5,
  })

  return {
    generatedAt: new Date().toISOString(),
    bookmarks: bookmarks.map(b => ({
      id: b.id,
      url: b.url,
      title: b.title,
      savedCount: b.savedCount,
      savedBy: b.user.username,
    })),
  }
}

/**
 * Sends a digest notification for a user.
 * Currently logs to console; swap out the notifier implementation via config.
 */
export async function sendDigestNotification(userId: number): Promise<void> {
  const digest = await buildDigest(userId)
  const titles = digest.bookmarks.map(b => b.title).join(', ')
  console.info(`[DigestNotifier] userId=${userId} digest titles: ${titles}`)
}
