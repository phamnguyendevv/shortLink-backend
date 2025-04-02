import HTTP_STATUS from '../constants/httpsStatus'
import { decoToken, generateToken, refreshTokens } from '../utils/jwt'
import authService from '../services/auth.service'

import { Request, Response, NextFunction } from 'express'
import { authRepository } from '../repositories/user.repositories'

const authController = {
  registerController: async (
    req: Request<{}, {}, CreateUserData>,
    res: Response<RegisterResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await authService.register(req.body)
      res.status(result.status || HTTP_STATUS.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  loginController: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user
      if (!user) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Người dùng không tồn tại'
        })
        return
      }
      const users = await authRepository.findUserById(user.id)

      // Exclude unnecessary fields
      if (!users) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Người dùng không tồn tại'
        })
        return
      }
      const { password, ...userCustom } = users

      // Generate tokens and handle errors
      try {
        const accessToken = await generateToken(user)
        const refreshToken = await refreshTokens(user)
        const decoded = await decoToken(accessToken)
        const exp = decoded.exp
        const token = { accessToken, refreshToken, exp }

        // Return successful response
        res.status(HTTP_STATUS.OK).json({
          message: 'Đăng nhập thành công',
          data: {
            user: userCustom,
            token
          }
        })
      } catch (tokenError) {
        console.error('Lỗi khi tạo token:', tokenError)
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: 'Lỗi khi tạo token'
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Lỗi khi đăng nhập:', error.message)
      } else {
        console.error('Lỗi khi đăng nhập:', error)
      }
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Đăng nhập thất bại'
      })
    }
  },

  refreshTokenController: async (
    req: Request<{}, {}, RefreshTokenData>,
    res: Response<RefreshTokenResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refresh_token } = req.body
      if (!refresh_token) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Refresh token không hợp lệ',
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      const result = await authService.refreshToken({ refresh_token })
      res.status(result.status || HTTP_STATUS.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  updateController: async (
    req: Request<{}, {}, UpdateUserData>,
    res: Response<RegisterResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id
      if (!userId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Người dùng không tồn tại',
          status: HTTP_STATUS.BAD_REQUEST
        })
        return
      }
      const result = await authService.updateUser(req.body, userId)
      res.status(result.status || HTTP_STATUS.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  getMeController: async (req: Request, res: Response<RegisterResponse>, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.id
      if (!userId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Người dùng không tồn tại',
          status: HTTP_STATUS.BAD_REQUEST
        })
        return
      }
      const result = await authService.getMe(Number(userId))
      res.status(result.status || HTTP_STATUS.OK).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default authController
