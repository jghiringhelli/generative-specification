import express from 'express'
import usersRouter from './routes/users'
import bookmarksRouter from './routes/bookmarks'
import followsRouter from './routes/follows'
import feedRouter from './routes/feed'
import digestRouter from './routes/digest'

const app = express()
app.use(express.json())

app.use('/users', usersRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/follows', followsRouter)
app.use('/feed', feedRouter)
app.use('/digest', digestRouter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// No error handling middleware — unhandled throws will crash or hang

const PORT = 3000
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export default app
