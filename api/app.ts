import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import cron from 'node-cron'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import registrationRoutes from './routes/registrations.js'
import dormitoryRoutes from './routes/dormitories.js'
import residentRoutes from './routes/residents.js'
import attendanceRoutes from './routes/attendance.js'
import notificationRoutes from './routes/notifications.js'
import { scheduleService } from './lib/prisma.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/registrations', registrationRoutes)
app.use('/api/dormitories', dormitoryRoutes)
app.use('/api/residents', residentRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/notifications', notificationRoutes)

cron.schedule('0 0 8 * * *', async () => {
  try {
    await scheduleService.runDailyCheck()
  } catch (error) {
    console.error('Cron daily check failed:', error)
  }
}, {
  timezone: 'Asia/Shanghai'
})

setTimeout(async () => {
  try {
    await scheduleService.runDailyCheck()
  } catch (error) {
    console.error('Initial daily check failed:', error)
  }
}, 3000)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API接口不存在',
  })
})

export default app
