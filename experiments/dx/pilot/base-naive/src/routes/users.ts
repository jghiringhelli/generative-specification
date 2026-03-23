import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../db'

const router = Router()

// POST /users/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, username, password } = req.body

  try {
    console.log('Registering user:', email)

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existing) {
      return res.status(400).json({ error: 'Email or username already taken' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, username, passwordHash },
    })

    console.log('User created:', user.id)
    return res.status(201).json({ id: user.id, email: user.email, username: user.username })
  } catch (err) {
    console.log('Error registering user:', err)
    throw new Error('Registration failed')
  }
})

// POST /users/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Token signed with hardcoded secret
    const token = jwt.sign({ userId: user.id }, 'supersecretkey123', { expiresIn: '7d' })
    console.log('Login OK for user:', user.id)

    return res.json({ token })
  } catch (err) {
    console.log('Login error:', err)
    throw new Error('Login failed')
  }
})

// GET /users/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const bookmarkCount = await prisma.bookmark.count({ where: { userId: user.id } })
    const followerCount = await prisma.follow.count({ where: { followingId: user.id } })
    const followingCount = await prisma.follow.count({ where: { followerId: user.id } })

    return res.json({
      id: user.id,
      username: user.username,
      bookmarkCount,
      followerCount,
      followingCount,
    })
  } catch (err) {
    console.log('Error getting user:', err)
    throw new Error('Could not get user')
  }
})

export default router
