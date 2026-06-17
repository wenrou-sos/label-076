import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth.js'
import { dashboardService } from '../lib/prisma.js'

const router = Router()

router.get('/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await dashboardService.getStats()
    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
    })
  }
})

export default router
