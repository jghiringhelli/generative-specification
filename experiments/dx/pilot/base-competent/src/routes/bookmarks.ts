import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../db'

const router = Router()

function getUserIdFromToken(req: Request): number | null {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const token = auth.replace('Bearer ', '')
    const payload = jwt.verify(token, 'supersecretkey123') as { userId: number }
    return payload.userId
  } catch {
    return null
  }
}

// GET /bookmarks - list all bookmarks (public, sorted by savedCount)
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Getting all bookmarks')

    const tag = req.query.tag as string | undefined

    let bookmarks

    if (tag) {
      bookmarks = await prisma.bookmark.findMany({
        where: {
          tags: { some: { tag: { name: tag } } },
        },
        include: {
          user: { select: { username: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { savedCount: 'desc' },
      })
    } else {
      bookmarks = await prisma.bookmark.findMany({
        include: {
          user: { select: { username: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { savedCount: 'desc' },
      })
    }

    console.log('Found bookmarks:', bookmarks.length)
    return res.json(bookmarks)
  } catch (err) {
    console.log('Error listing bookmarks:', err)
    throw new Error('Could not list bookmarks')
  }
})

// POST /bookmarks - create a bookmark
router.post('/', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { url, title, description, tags } = req.body

  try {
    console.log('Creating bookmark for user:', userId, url)

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        url,
        title,
        description,
      },
    })

    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } })
        if (!tag) {
          tag = await prisma.tag.create({ data: { name: tagName } })
        }
        await prisma.bookmarkTag.create({
          data: { bookmarkId: bookmark.id, tagId: tag.id },
        })
      }
    }

    const full = await prisma.bookmark.findUnique({
      where: { id: bookmark.id },
      include: { tags: { include: { tag: true } } },
    })

    return res.status(201).json(full)
  } catch (err) {
    console.log('Error creating bookmark:', err)
    throw new Error('Could not create bookmark')
  }
})

// DELETE /bookmarks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: parseInt(req.params.id) },
    })

    if (!bookmark) return res.status(404).json({ error: 'Not found' })

    // Bug: does not check bookmark.userId === userId
    await prisma.bookmarkTag.deleteMany({ where: { bookmarkId: bookmark.id } })
    await prisma.bookmark.delete({ where: { id: bookmark.id } })

    console.log('Deleted bookmark:', bookmark.id)
    return res.status(204).send()
  } catch (err) {
    console.log('Error deleting bookmark:', err)
    throw new Error('Could not delete bookmark')
  }
})

// POST /bookmarks/:id/save - increment savedCount (re-save someone else's bookmark)
router.post('/:id/save', async (req: Request, res: Response) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: parseInt(req.params.id) },
    })

    if (!bookmark) return res.status(404).json({ error: 'Not found' })

    const updated = await prisma.bookmark.update({
      where: { id: bookmark.id },
      data: { savedCount: bookmark.savedCount + 1 },
    })

    console.log('Saved bookmark:', bookmark.id, 'new count:', updated.savedCount)
    return res.json(updated)
  } catch (err) {
    console.log('Error saving bookmark:', err)
    throw new Error('Could not save bookmark')
  }
})

export default router
