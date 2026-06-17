import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth.js'
import { userService } from '../lib/prisma.js'
import { generateToken } from '../utils/jwt.js'
import { comparePassword } from '../utils/password.js'
import type { LoginRequest, LoginResponse } from '../../shared/types.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password }: LoginRequest = req.body

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: '用户名和密码不能为空',
      })
      return
    }

    const user = await userService.findByUsername(username)
    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      })
      return
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: '账户已被禁用',
      })
      return
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      })
      return
    }

    const token = generateToken(user)
    const { passwordHash, ...userWithoutPassword } = user

    const response: LoginResponse = {
      token,
      user: userWithoutPassword,
    }

    res.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: '登录失败',
    })
  }
})

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: req.user,
    })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    })
  }
})

export default router
