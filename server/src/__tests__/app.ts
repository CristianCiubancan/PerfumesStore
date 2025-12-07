/**
 * Test Application
 *
 * A minimal Express app for integration testing without starting the server.
 */
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import routes from '../routes'
import { errorHandler, notFoundHandler } from '../middleware/errorHandler'

const app = express()

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '50kb' }))
app.use(cookieParser())

app.use('/api', routes)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
