import { checkSchema } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import USERS_MESSAGES from '../constants/message'
import { comparePassword } from '../utils/password'
import validate from '../utils/validate'

const prisma = new PrismaClient()
// Mở rộng interface Request để thêm user vào req
declare module 'express' {
  interface Request {
    user?: User
  }
}
export const registerValidator = validate(
  checkSchema(
    {
      username: {
        trim: true,
        isLength: {
          options: { min: 1 },
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_LONGER_THAN_1_CHARACTER
        },
        custom: {
          options: async (value: string) => {
            try {
              const user = await prisma.user.findUnique({
                where: { username: value }
              })
              if (!user) {
                return true
              } else {
                throw new Error(USERS_MESSAGES.USERNAME_IS_EXISTED)
              }
            } catch (error) {
              console.error(error)
              throw new Error(USERS_MESSAGES.USERNAME_IS_EXISTED)
            }
          }
        }
      },

      email: {
        trim: true,
        isEmail: {
          errorMessage: USERS_MESSAGES.INVALID_EMAIL
        },
        matches: {
          options: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/],
          errorMessage: USERS_MESSAGES.INVALID_EMAIL
        },
        custom: {
          options: async (value: string) => {
            try {
              const user = await prisma.user.findUnique({
                where: { email: value }
              })
              if (!user) {
                return true
              } else {
                throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
              }
            } catch (error) {
              console.error(error)
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
            }
          }
        }
      },
      password: {
        trim: true,
        isLength: {
          options: { min: 6 },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_LONGER_THAN_6_CHARACTERS
        }
      }
    },
    ['body']
  )
)

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        trim: true,
        isEmail: {
          errorMessage: USERS_MESSAGES.INVALID_EMAIL
        },
        custom: {
          options: async (value: string, meta) => {
            const user = await prisma.user.findUnique({
              where: { email: value }
            })

            if (!user) {
              throw new Error(USERS_MESSAGES.USER_NOT_FOUND)
            }

            meta.req.user = user
            return true
          }
        }
      },
      password: {
        trim: true,
        isLength: {
          options: { min: 1 }, // Chỉnh min thành 1 thay vì 0 (password không thể rỗng)
          errorMessage: USERS_MESSAGES.MATCH_PASSWORD
        },
        custom: {
          options: async (value: string, meta) => {
            if (!meta.req.user) {
              throw new Error(USERS_MESSAGES.USER_NOT_FOUND)
            }

            const isMatch = await comparePassword(value, meta.req.user.password)
            if (!isMatch) {
              throw new Error(USERS_MESSAGES.PASSWORD_NOT_MATCH)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)
