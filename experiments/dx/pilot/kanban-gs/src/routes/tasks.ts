import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'supersecretkey123'

function getUserIdFromToken(req: Request): number | null {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET) as { userId: number }
    return payload.userId
  } catch { return null }
}

// GET /tasks?projectId=...
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const projectId = parseInt(req.query.projectId as string)
  if (isNaN(projectId)) return res.status(400).json({ error: 'projectId required' })

  try {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { user: { select: { id: true, username: true } } },
        },
      },
    })
    return res.json(tasks)
  } catch {
    return res.status(500).json({ error: 'Could not get tasks' })
  }
})

// POST /tasks
router.post('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { projectId, title, description, assigneeId } = req.body

  try {
    const task = await prisma.task.create({
      data: { projectId, title, description, assigneeId: assigneeId || null, status: 'TODO' },
    })
    return res.status(201).json(task)
  } catch {
    return res.status(500).json({ error: 'Could not create task' })
  }
})

// POST /tasks/:id/status — atomic with $transaction
router.post('/:id/status', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const taskId = parseInt(req.params.id)
  const { status } = req.body

  if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return res.status(404).json({ error: 'Task not found' })

    const previousStatus = task.status

    await prisma.$transaction([
      prisma.task.update({ where: { id: taskId }, data: { status } }),
      prisma.activityLog.create({
        data: { taskId, userId, action: 'STATUS_CHANGE', fromStatus: previousStatus, toStatus: status },
      }),
    ])

    return res.json({ taskId, previousStatus, status })
  } catch {
    return res.status(500).json({ error: 'Could not update status' })
  }
})

// GET /tasks/:id
router.get('/:id', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const taskId = parseInt(req.params.id)

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, username: true } } },
        },
      },
    })
    if (!task) return res.status(404).json({ error: 'Task not found' })
    return res.json(task)
  } catch {
    return res.status(500).json({ error: 'Could not get task' })
  }
})

export default router
