import express from 'express'
import authRouter from './user.routes'
import teamRouter from './team.routes'
import linkRouter from './link.routes'
const router = express.Router()

router.get('/', (req, res) => {
  res.send('web chay ngon keng luon!')
})

router.use('/', authRouter)
router.use('/team', teamRouter)
router.use('', linkRouter)
export default router
