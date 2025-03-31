import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { errorHandler } from './middlewares/error.middlewares'
import rootRouter from './routes/index'
import { config } from './config/config'
const PORT = config.server.port

const app = express()

// Middleware
app.use(helmet())
app.use(compression())
app.use(morgan('dev'))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use(rootRouter)

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
