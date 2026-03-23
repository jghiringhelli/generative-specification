import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../db'

const router = Router()

// POST /users/register
router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already in use' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, email, passwordHash: hashed },
    })

    console.log('Registered user:', user.id)
    return res.status(201).json({ id: user.id, username: user.username, email: user.email })
  } catch (err) {
    console.log('Register error:', err)
    throw new Error('Could not register user')
  }
})

// POST /users/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ userId: user.id }, 'supersecretkey123', { expiresIn: '24h' })

    console.log('Login for user:', user.id)
    return res.json({ token, userId: user.id })
  } catch (err) {
    console.log('Login error:', err)
    throw new Error('Could not log in')
  }
})

export default router
