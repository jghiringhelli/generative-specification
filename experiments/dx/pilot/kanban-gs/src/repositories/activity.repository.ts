import prisma from '../db'

export interface ActivityEntry {
  id: number
  action: string
  fromStatus: string | null
  toStatus: string | null
  changedAt: Date
  task: {
    id: number
    title: string
    projectId: number
    projectName: string
  }
  changedBy: {
    id: number
    username: string
  }
}

/**
 * Returns the last 20 activity log entries for all projects the user is a member of.
 * @param userId - The authenticated user's ID.
 * @returns Array of activity entries ordered by most recent first.
 */
export async function findActivityForUser(userId: number): Promise<ActivityEntry[]> {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  })

  const projectIds = memberships.map(m => m.projectId)

  const logs = await prisma.activityLog.findMany({
    where: { task: { projectId: { in: projectIds } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      task: { include: { project: { select: { name: true } } } },
      user: { select: { id: true, username: true } },
    },
  })

  return logs.map(log => ({
    id: log.id,
    action: log.action,
    fromStatus: log.fromStatus,
    toStatus: log.toStatus,
    changedAt: log.createdAt,
    task: {
      id: log.task.id,
      title: log.task.title,
      projectId: log.task.projectId,
      projectName: log.task.project.name,
    },
    changedBy: {
      id: log.user.id,
      username: log.user.username,
    },
  }))
}
