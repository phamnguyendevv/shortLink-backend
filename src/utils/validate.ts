import { validationResult, ValidationChain } from 'express-validator'
import { Request, Response, NextFunction } from 'express'
import HTTP_STATUS from '../constants/httpsStatus'

const validate = (validations: ValidationChain[]) => async (req: Request, res: Response, next: NextFunction) => {
  for (const validation of validations) {
    await validation.run(req)
  }

  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }

  const firstError = errors.array()[0]
  const message: string = firstError.msg
  const status: number = HTTP_STATUS.UNPROCESSABLE_ENTITY

  res.status(status).json({ message, status })
}

export default validate
