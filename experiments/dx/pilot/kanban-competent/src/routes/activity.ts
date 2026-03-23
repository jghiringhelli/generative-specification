import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db'

const router = Router()

function getUserIdFromToken(req: Request): number | null {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const payload = jwt.verify(
      auth.replace('Bearer ', ''), 'supersecretkey123'
    ) as { userId: number }
    return payload.userId
  } catch { return null }
}

// GET /activity
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    // Get all projects the user is a member of
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
    })

    const projectIds = memberships.map(m => m.projectId)

    // Get activity logs for tasks in those projects
    const logs = await prisma.activityLog.findMany({
      where: {
        task: { projectId: { in: projectIds } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        task: { include: { project: true } },
        user: { select: { id: true, username: true } },
      },
    })

    console.log('Activity logs:', logs.length)

    return res.json({
      generatedAt: new Date().toISOString(),
      entries: logs.map(log => ({
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
      })),
    })
  } catch (err) {
    console.log('Activity error:', err)
    throw new Error('Could not get activity')
  }
})

export default router
