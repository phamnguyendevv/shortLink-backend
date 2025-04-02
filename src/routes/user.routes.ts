import express from 'express'
import wrapAsync from '../utils/handlers'
import { loginValidator, registerValidator } from '../middlewares/validation.middlewares'
import { isAuthenticatedUser, authorizeRoles } from '../middlewares/auth.middleware'
import AuthController from '../controllers/auth.controller'
const router = express.Router()

router.post('/auth/register', registerValidator, wrapAsync(AuthController.registerController))

router.post('/auth/login', loginValidator, wrapAsync(AuthController.loginController))

router.post('auth/refresh-token', wrapAsync(AuthController.refreshTokenController))

router.post('/user/update', isAuthenticatedUser, wrapAsync(AuthController.updateController))

router.get('/user/:id', wrapAsync(AuthController.getMeController))

export default router
