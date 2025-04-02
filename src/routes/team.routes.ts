import express from 'express'
import wrapAsync from '../utils/handlers'
import { authorizeRoles, isAuthenticatedUser } from '../middlewares/auth.middleware'
import TeamController from '../controllers/team.controller'
import { Rights } from '../constants/rights'

const router = express.Router()

router.get('', isAuthenticatedUser, wrapAsync(TeamController.getTeam))

router.patch(
  '/update',
  isAuthenticatedUser,
  authorizeRoles(Rights.TEAM_ADMIN, Rights.ADMIN),
  wrapAsync(TeamController.updateTeam)
)

router.post('/list', isAuthenticatedUser, authorizeRoles(Rights.ADMIN), wrapAsync(TeamController.getListTeam))
export default router
