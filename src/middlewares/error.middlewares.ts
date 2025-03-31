import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  statusCode?: number
  status?: string
  isOperational?: boolean
}

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  const error = err as AppError // Ép kiểu về AppError

  error.statusCode = error.statusCode || 500
  error.status = error.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      status: error.status,
      error,
      message: error.message,
      stack: error.stack
    })
  } else {
    // Production mode
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      })
    } else {
      // Programming or unknown errors
      console.error('ERROR 💥', error)
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
      })
    }
  }
}
