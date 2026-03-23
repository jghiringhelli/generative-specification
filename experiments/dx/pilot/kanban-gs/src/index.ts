import express, { Request, Response, NextFunction } from 'express'
import usersRouter from './routes/users'
import projectsRouter from './routes/projects'
import tasksRouter from './routes/tasks'
import commentsRouter from './routes/comments'
import activityRouter from './routes/activity'

const app = express()
app.use(express.json())

app.use('/users', usersRouter)
app.use('/projects', projectsRouter)
app.use('/tasks', tasksRouter)
app.use('/comments', commentsRouter)
app.use('/activity', activityRouter)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = parseInt(process.env.PORT ?? '3001', 10)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => { console.log(`Server running on port ${PORT}`) })
}

export default app
