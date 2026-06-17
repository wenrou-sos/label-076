import { Router, type Request, type Response } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { attendanceService } from '../lib/prisma.js'
import type { PaginationParams } from '../../shared/types.js'

const router = Router()

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const params: PaginationParams & { date?: string; session?: string } = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      date: req.query.date as string,
      session: req.query.session as string,
    }
    const result = await attendanceService.findAll(params)
    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get attendance error:', error)
    res.status(500).json({
      success: false,
      error: '获取考勤记录失败',
    })
  }
})

router.post('/batch', authenticate, requireRole('admin', 'chanting_master'), async (req: Request, res: Response): Promise<void> => {
  try {
    const request = req.body
    if (!request.date || !request.session || !request.records) {
      res.status(400).json({
        success: false,
        error: '请提供完整的考勤信息',
      })
      return
    }
    const records = await attendanceService.batchCreate(request, req.user!.id)
    res.json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error('Batch create attendance error:', error)
    res.status(500).json({
      success: false,
      error: '批量登记考勤失败',
    })
  }
})

router.get('/absent-count', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7
    const count = await attendanceService.getAbsentCount(days)
    res.json({
      success: true,
      data: { count, days },
    })
  } catch (error) {
    console.error('Get absent count error:', error)
    res.status(500).json({
      success: false,
      error: '获取缺勤统计失败',
    })
  }
})

router.get('/absent-alerts', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 3
    const alerts = await attendanceService.getAbsentAlerts(threshold)
    res.json({
      success: true,
      data: alerts,
    })
  } catch (error) {
    console.error('Get absent alerts error:', error)
    res.status(500).json({
      success: false,
      error: '获取缺勤提醒失败',
    })
  }
})

export default router
