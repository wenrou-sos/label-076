import type { Request, Response, NextFunction } from 'express'
import { verifyToken, type JwtPayload } from '../utils/jwt.js'
import { userService } from '../lib/prisma.js'
import type { User } from '../../shared/types.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: User
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    })
    return
  }

  const token = authHeader.slice(7)
  const payload = verifyToken(token)

  if (!payload) {
    res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期',
    })
    return
  }

  const user = await userService.findById(payload.userId)
  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: '用户不存在或已被禁用',
    })
    return
  }

  req.user = user
  next()
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: '权限不足',
      })
      return
    }

    next()
  }
}
