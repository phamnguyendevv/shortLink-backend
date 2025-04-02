import TeamService from '../services/team.service'
import HTTP_STATUS from '../constants/httpsStatus'

import { Request, Response, NextFunction } from 'express'

const TeamController = {
  getTeam: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user
      if (!user) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Người dùng không tồn tại'
        })
        return
      }
      const team = await TeamService.getTeam(user.id)
      res.status(HTTP_STATUS.OK).json(team)
    } catch (error) {
      next(error)
    }
  },
  updateTeam: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user
      if (!user) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Người dùng không tồn tại'
        })
        return
      }
      const team = await TeamService.updateTeam(user.id, req.body)
      res.status(HTTP_STATUS.OK).json(team)
    } catch (error) {
      next(error)
    }
  },

  getListTeam: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user
      if (!user) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Người dùng không tồn tại'
        })
        return
      }
      const team = await TeamService.getListTeam(user.id)
      res.status(HTTP_STATUS.OK).json(team)
    } catch (error) {
      next(error)
    }
  }
}

export default TeamController
