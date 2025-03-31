import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

const JWT_ACCESS_KEY = process.env.JWT_ACCESS_KEY as string

if (!JWT_ACCESS_KEY) {
  throw new Error('Missing JWT_ACCESS_KEY in environment variables')
}

// Định nghĩa interface cho User
interface User {
  id: number
}

// Hàm tạo Access Token
const generateToken = async (user: User): Promise<string> => {
  return jwt.sign({ id: user.id }, JWT_ACCESS_KEY, {
    expiresIn: '1h'
  })
}

// Hàm tạo Refresh Token
const refreshTokens = async (user: User): Promise<string> => {
  return jwt.sign({ id: user.id }, JWT_ACCESS_KEY, {
    expiresIn: '7d'
  })
}

// Giải mã Token
const decoToken = async (token: string): Promise<any> => {
  return jwt.verify(token, JWT_ACCESS_KEY)
}

export { generateToken, refreshTokens, decoToken }
