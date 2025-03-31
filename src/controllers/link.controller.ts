import HTTP_STATUS from '../constants/httpsStatus'
import { Request, Response, NextFunction } from 'express'
import LinkService from '../services/link.service'
import { getClientIps } from '../utils/checkLink'

const linkController = {
  createLink: async (
    req: Request<{}, {}, CreateUserData>,
    res: Response<RegisterResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user
      if (!user) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Người dùng không tồn tại',
          status: HTTP_STATUS.BAD_REQUEST,
          data: {}
        })
        return
      }
      const userId = user.id

      const result = await LinkService.createLink(userId, req.body)
      res.status(result.status || HTTP_STATUS.OK).json(result)
    } catch (error) {
      next(error)
    }
  },
  getLink: async (req: Request, res: Response<RegisterResponse>, next: NextFunction): Promise<void> => {
    try {
      const path = req.params.path
      const ip = getClientIps(req)
      console.log('ip', ip)
      const result = await LinkService.getLink(path, ip)
      res.status(result.status || HTTP_STATUS.OK).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default linkController
