import express from 'express'
import wrapAsync from '../utils/handlers'
import { authorizeRoles, isAuthenticatedUser } from '../middlewares/auth.middleware'
import linkController from '../controllers/link.controller'
import { Rights } from '../constants/rights'
import { advancedBotDetection, checkJavaScript, detectSuspiciousRequest } from '../utils/checkLink'

const router = express.Router()

router.post(
  '/link',
  isAuthenticatedUser,
  authorizeRoles(Rights.TEAM_ADMIN, Rights.ADMIN, Rights.TEAM_MEMBER),
  wrapAsync(linkController.createLink)
)

router.get('/:path', checkJavaScript, advancedBotDetection, detectSuspiciousRequest, wrapAsync(linkController.getLink))

export default router
