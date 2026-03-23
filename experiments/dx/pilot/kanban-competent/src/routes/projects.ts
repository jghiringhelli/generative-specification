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

// GET /projects
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
    })

    // N+1: fetch each project separately
    const projects = []
    for (const m of memberships) {
      const project = await prisma.project.findUnique({
        where: { id: m.projectId },
      })
      const taskCount = await prisma.task.count({ where: { projectId: m.projectId } })
      const memberCount = await prisma.projectMember.count({ where: { projectId: m.projectId } })
      projects.push({ ...project, taskCount, memberCount, role: m.role })
    }

    console.log('Projects for user', userId, ':', projects.length)
    return res.json(projects)
  } catch (err) {
    console.log('Error getting projects:', err)
    throw new Error('Could not get projects')
  }
})

// POST /projects
router.post('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { name, description } = req.body

  try {
    const project = await prisma.project.create({
      data: { name, description, ownerId: userId },
    })

    // Add creator as OWNER member — not atomic with project creation
    await prisma.projectMember.create({
      data: { projectId: project.id, userId, role: 'OWNER' },
    })

    console.log('Created project:', project.id)
    return res.status(201).json(project)
  } catch (err) {
    console.log('Error creating project:', err)
    throw new Error('Could not create project')
  }
})

// POST /projects/:id/members
router.post('/:id/members', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const projectId = parseInt(req.params.id)
  const { targetUserId } = req.body

  try {
    // No ownership check — any authenticated user can add members to any project
    const target = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!target) return res.status(404).json({ error: 'User not found' })

    await prisma.projectMember.create({
      data: { projectId, userId: targetUserId, role: 'MEMBER' },
    })

    console.log('Added member', targetUserId, 'to project', projectId)
    return res.status(201).json({ message: 'Member added' })
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Already a member' })
    console.log('Add member error:', err)
    throw new Error('Could not add member')
  }
})

export default router
