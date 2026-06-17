import { Router, type Request, type Response } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { dormitoryService } from '../lib/prisma.js'
import type { PaginationParams } from '../../shared/types.js'

const router = Router()

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const params: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      keyword: req.query.keyword as string,
      status: req.query.status as string,
    }
    const result = await dormitoryService.findAll(params)
    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get dormitories error:', error)
    res.status(500).json({
      success: false,
      error: '获取寮房列表失败',
    })
  }
})

router.post('/', authenticate, requireRole('admin', 'receptionist'), async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body
    const dormitory = await dormitoryService.create(data)
    res.json({
      success: true,
      data: dormitory,
    })
  } catch (error) {
    console.error('Create dormitory error:', error)
    res.status(500).json({
      success: false,
      error: '创建寮房失败',
    })
  }
})

router.put('/:id', authenticate, requireRole('admin', 'receptionist'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const data = req.body
    const dormitory = await dormitoryService.update(id, data)
    if (!dormitory) {
      res.status(404).json({
        success: false,
        error: '寮房不存在',
      })
      return
    }
    res.json({
      success: true,
      data: dormitory,
    })
  } catch (error) {
    console.error('Update dormitory error:', error)
    res.status(500).json({
      success: false,
      error: '更新寮房失败',
    })
  }
})

export default router
