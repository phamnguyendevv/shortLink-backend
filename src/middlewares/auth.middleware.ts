import { Request, Response, NextFunction } from 'express'
import HTTP_STATUS from '../constants/httpsStatus'
import { decoToken } from '../utils/jwt'
import wrapAsync from '../utils/handlers'
import { authRepository } from '../repositories/user.repositories'

interface UserPayload {
  id: string
  // Add other user properties you expect in the token
}

export const isAuthenticatedUser = wrapAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers['x-access-token'] || req.headers['authorization']

    // Check if token exists
    if (!token) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token không hợp lệ'
      })
      return
    }

    // Remove "Bearer " from token if present
    const access_token = typeof token === 'string' ? token.replace(/^Bearer\s+/, '') : ''

    // Validate access token
    if (!access_token || typeof access_token !== 'string') {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token không hợp lệ'
      })
      return
    }

    // Decode the token
    const decoded = (await decoToken(access_token)) as UserPayload & { iat?: number; exp?: number }

    // Check if decoded data is valid
    if (!decoded || !decoded.id) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token không hợp lệ'
      })
      return
    }

    // Remove timestamp fields and keep only user data
    const { iat, exp, ...userData } = decoded

    // Attach user data to request object
    req.user = userData as unknown as User
    console.log('req.user', req.user)
    // Proceed to next middleware
    next()
  } catch (error) {
    // Handle different types of errors appropriately
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token đã hết hạn'
      })
      return
    }

    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token không hợp lệ'
      })
      return
    }

    // For other unexpected errors
    console.error('Authentication error:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER).json({
      message: 'Lỗi xác thực'
    })
  }
})

export const authorizeRoles = (...allowedRoles: string[]) => {
  return wrapAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id
    if (!userId) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Người dùng không có quyền truy cập'
      })
      return
    }
    const user = await authRepository.findUserById(Number(userId))
    if (!user) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy người dùng'
      })
      return
    }

    const userRights = Array.isArray(user.rights) ? user.rights : [user.rights]
    const hasPermission = userRights.some((right: string) => allowedRoles.includes(right))

    if (!hasPermission) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Người dùng không có quyền truy cập'
      })
      return
    }

    next()
  })
}
