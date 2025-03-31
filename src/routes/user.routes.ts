import express from 'express'
import wrapAsync from '../utils/handlers'
import { loginValidator, registerValidator } from '../middlewares/validation.middlewares'
import { isAuthenticatedUser, authorizeRoles } from '../middlewares/auth.middleware'
import { Rights } from '../constants/rights'
import AuthController from '../controllers/auth.controller'
const router = express.Router()

router.post(
  '/signup',
  registerValidator,
  isAuthenticatedUser,
  authorizeRoles(Rights.TEAM_ADMIN, Rights.ADMIN),
  wrapAsync(AuthController.registerController)
)
router.post(
  '/signup-admin',
  registerValidator,

  wrapAsync(AuthController.registerAdminController)
)

router.post(
  '/signup-with-team',
  registerValidator,
  isAuthenticatedUser,
  authorizeRoles(Rights.ADMIN),
  wrapAsync(AuthController.registerWithTeamController)
)
router.post('/signin', loginValidator, wrapAsync(AuthController.loginController))

router.post('/refresh-token', wrapAsync(AuthController.refreshTokenController))

router.patch('/update-password', isAuthenticatedUser, wrapAsync(AuthController.updatePasswordController))

router.post('/update-setting', isAuthenticatedUser, wrapAsync(AuthController.updateSettingController))

router.get('/:id', wrapAsync(AuthController.getMeController))

export default router
