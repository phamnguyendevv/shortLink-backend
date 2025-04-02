import express from 'express'
import authRouter from './user.routes'
import teamRouter from './team.routes'
import linkRouter from './link.routes'
const router = express.Router()

router.get('/health', (req, res) => {
  res.send('Shope web is healthy!')
})

router.use('/', authRouter)
router.use('/team', teamRouter)
router.use('', linkRouter)
export default router
