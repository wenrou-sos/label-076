import { Router, type Request, type Response } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { registrationService } from '../lib/prisma.js'
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
    const result = await registrationService.findAll(params)
    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get registrations error:', error)
    res.status(500).json({
      success: false,
      error: '获取挂单登记列表失败',
    })
  }
})

router.post('/', authenticate, requireRole('admin', 'receptionist'), async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body
    const registration = await registrationService.create({
      ...data,
      arrivalDate: new Date(data.arrivalDate),
      createdBy: req.user?.id,
    })
    res.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error('Create registration error:', error)
    res.status(500).json({
      success: false,
      error: '创建挂单登记失败',
    })
  }
})

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const registration = await registrationService.findById(id)
    if (!registration) {
      res.status(404).json({
        success: false,
        error: '挂单登记不存在',
      })
      return
    }
    res.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error('Get registration error:', error)
    res.status(500).json({
      success: false,
      error: '获取挂单登记详情失败',
    })
  }
})

router.put('/:id', authenticate, requireRole('admin', 'receptionist'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const data = req.body
    if (data.arrivalDate) {
      data.arrivalDate = new Date(data.arrivalDate)
    }
    if (data.actualLeaveDate) {
      data.actualLeaveDate = new Date(data.actualLeaveDate)
    }
    const registration = await registrationService.update(id, data)
    if (!registration) {
      res.status(404).json({
        success: false,
        error: '挂单登记不存在',
      })
      return
    }
    res.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error('Update registration error:', error)
    res.status(500).json({
      success: false,
      error: '更新挂单登记失败',
    })
  }
})

router.delete('/:id', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const success = await registrationService.delete(id)
    if (!success) {
      res.status(404).json({
        success: false,
        error: '挂单登记不存在',
      })
      return
    }
    res.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    console.error('Delete registration error:', error)
    res.status(500).json({
      success: false,
      error: '删除挂单登记失败',
    })
  }
})

router.put('/:id/assign-bed', authenticate, requireRole('admin', 'receptionist'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { roomNumber, bedNumber, dormitoryId } = req.body
    if (!dormitoryId && (!roomNumber || !bedNumber)) {
      res.status(400).json({
        success: false,
        error: '请提供寮房ID或房间号和床位号',
      })
      return
    }
    const registration = await registrationService.assignBed(id, { roomNumber, bedNumber, dormitoryId })
    if (!registration) {
      res.status(400).json({
        success: false,
        error: '分配床位失败，请检查寮房是否可用',
      })
      return
    }
    res.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error('Assign bed error:', error)
    res.status(500).json({
      success: false,
      error: '分配床位失败',
    })
  }
})

router.post('/:id/start-probation', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const registration = await registrationService.startProbation(id)
    if (!registration) {
      res.status(404).json({
        success: false,
        error: '挂单登记不存在',
      })
      return
    }
    res.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error('Start probation error:', error)
    res.status(500).json({
      success: false,
      error: '开始考察期失败',
    })
  }
})

export default router
