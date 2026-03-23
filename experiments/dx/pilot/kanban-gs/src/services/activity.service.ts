import { findActivityForUser, ActivityEntry } from '../repositories/activity.repository'

export interface ActivityDigest {
  generatedAt: string
  entries: ActivityEntry[]
}

/**
 * Builds the activity digest for a user across all their projects.
 * @param userId - The authenticated user's ID.
 * @returns Activity digest with timestamp and entries.
 */
export async function getActivityDigest(userId: number): Promise<ActivityDigest> {
  const entries = await findActivityForUser(userId)
  return {
    generatedAt: new Date().toISOString(),
    entries,
  }
}
