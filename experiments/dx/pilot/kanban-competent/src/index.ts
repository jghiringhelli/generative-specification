import express from 'express'
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

// Hardcoded port — no env config, no error middleware
if (process.env.NODE_ENV !== 'test') {
  app.listen(3001, () => {
    console.log('Server running on port 3001')
  })
}

export default app
