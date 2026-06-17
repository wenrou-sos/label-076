import express, { type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth.js'
import { notificationService, scheduleService } from '../lib/prisma.js'
import type { PaginationParams } from '../../shared/types.js'

const router = express.Router()

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const params: PaginationParams & { isRead?: boolean; type?: string } = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      isRead: req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined,
      type: req.query.type as string,
    }
    const result = await notificationService.findAll(params)
    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({
      success: false,
      error: '获取消息列表失败',
    })
  }
})

router.get('/unread-count', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await notificationService.getUnreadCount()
    res.json({
      success: true,
      data: count,
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({
      success: false,
      error: '获取未读数量失败',
    })
  }
})

router.put('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const success = await notificationService.markAsRead(id)
    if (!success) {
      res.status(404).json({
        success: false,
        error: '消息不存在',
      })
      return
    }
    res.json({
      success: true,
      data: null,
    })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({
      success: false,
      error: '标记已读失败',
    })
  }
})

router.put('/read-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await notificationService.markAllAsRead()
    res.json({
      success: true,
      data: count,
    })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({
      success: false,
      error: '全部标记已读失败',
    })
  }
})

router.get('/expiring-registrations', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 3
    const list = await scheduleService.getExpiringRegistrations(days)
    res.json({
      success: true,
      data: list,
    })
  } catch (error) {
    console.error('Get expiring registrations error:', error)
    res.status(500).json({
      success: false,
      error: '获取即将到期挂单失败',
    })
  }
})

router.post('/run-daily-check', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await scheduleService.runDailyCheck()
    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Run daily check error:', error)
    res.status(500).json({
      success: false,
      error: '执行每日检查失败',
    })
  }
})

export default router
