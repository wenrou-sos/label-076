import { Router, type Request, type Response } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { residentService } from '../lib/prisma.js'
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
    const result = await residentService.findAll(params)
    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get residents error:', error)
    res.status(500).json({
      success: false,
      error: '获取常住僧人列表失败',
    })
  }
})

router.get('/probation', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const residents = await residentService.findProbation()
    res.json({
      success: true,
      data: residents,
    })
  } catch (error) {
    console.error('Get probation residents error:', error)
    res.status(500).json({
      success: false,
      error: '获取考察期僧人列表失败',
    })
  }
})

router.post('/', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body
    const resident = await residentService.create({
      ...data,
      preceptsDate: new Date(data.preceptsDate),
      probationStartDate: new Date(data.probationStartDate),
    })
    res.json({
      success: true,
      data: resident,
    })
  } catch (error) {
    console.error('Create resident error:', error)
    res.status(500).json({
      success: false,
      error: '创建常住僧人失败',
    })
  }
})

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const resident = await residentService.findById(id)
    if (!resident) {
      res.status(404).json({
        success: false,
        error: '常住僧人不存在',
      })
      return
    }
    res.json({
      success: true,
      data: resident,
    })
  } catch (error) {
    console.error('Get resident error:', error)
    res.status(500).json({
      success: false,
      error: '获取常住僧人详情失败',
    })
  }
})

router.put('/:id', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const data = req.body
    if (data.preceptsDate) {
      data.preceptsDate = new Date(data.preceptsDate)
    }
    if (data.probationStartDate) {
      data.probationStartDate = new Date(data.probationStartDate)
    }
    if (data.probationEndDate) {
      data.probationEndDate = new Date(data.probationEndDate)
    }
    if (data.ordinationCeremonyDate) {
      data.ordinationCeremonyDate = new Date(data.ordinationCeremonyDate)
    }
    const resident = await residentService.update(id, data)
    if (!resident) {
      res.status(404).json({
        success: false,
        error: '常住僧人不存在',
      })
      return
    }
    res.json({
      success: true,
      data: resident,
    })
  } catch (error) {
    console.error('Update resident error:', error)
    res.status(500).json({
      success: false,
      error: '更新常住僧人失败',
    })
  }
})

router.put('/:id/complete-probation', authenticate, requireRole('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { ordinationCeremonyDate } = req.body
    if (!ordinationCeremonyDate) {
      res.status(400).json({
        success: false,
        error: '请提供圆具日期',
      })
      return
    }
    const resident = await residentService.completeProbation(
      id,
      new Date(ordinationCeremonyDate)
    )
    if (!resident) {
      res.status(404).json({
        success: false,
        error: '常住僧人不存在',
      })
      return
    }
    res.json({
      success: true,
      data: resident,
    })
  } catch (error) {
    console.error('Complete probation error:', error)
    res.status(500).json({
      success: false,
      error: '完成考察期失败',
    })
  }
})

export default router
