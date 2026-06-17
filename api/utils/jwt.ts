import jwt from 'jsonwebtoken'
import type { User } from '../../shared/types.js'

const JWT_SECRET = process.env.JWT_SECRET || 'temple_management_jwt_secret_key_2024'
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d'

export interface JwtPayload {
  userId: string
  username: string
  role: string
}

export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    return null
  }
}
