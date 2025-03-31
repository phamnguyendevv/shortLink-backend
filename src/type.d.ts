interface CreateUserData {
  email: string
  username: string
  password: string
  rights: string
  isVerifiedByEmail: boolean
  teamId?: number | null
  code?: string
  targetUrl?: string
}

interface CreateTeamData {
  name: string
  status: string
  targetUrl?: string
}

interface RegisterWithTeamData {
  username: string
  email: string
  password: string
  teamName?: string
  targetUrl?: string
}

interface User {
  id: number
  email: string
  username: string
  rights: string
  isVerifiedByEmail: boolean
  teamId?: number | null
  password?: string
  createdAt?: Date
  updatedAt?: Date
}

interface Team {
  id: number
  name: string
  status: string
  targetUrl?: string
}

interface RegisterResponse {
  message: string
  data?: Partial<User>
  status: number
}

interface RegisterWithTeamResponse {
  message: string
  data?: {
    user: Partial<User>
    team: Team
  }
  status: number
}

interface LoginResponse {
  message: string
  data?: {
    user: Partial<User>
    token: {
      accessToken: string
      refreshToken: string
      exp: number
    }
  }
  status: number
}

interface RefreshTokenResponse {
  message: string
  data?: {
    user: Partial<User>
    token: {
      accessToken: string
      refreshToken: string
      exp: number
    }
  }
  status: number
}

interface UserPayload {
  id: string
  rights: string
  // Add other user properties you expect in the token
}

interface AuthRequest extends Request {
  user?: UserPayload
}

interface AuthResponse extends Response {
  user?: UserPayload
}
interface RefreshTokenData {
  refresh_token: string
}

interface UpdatePasswordData {
  oldPassword: string
  newPassword: string
}
interface UpdatePasswordResponse {
  message: string
  status: number
}
interface UpdateSettingData {
  domains?: string[]
  targetUrl?: string
}

interface Setting {
  id: number
  userId: number
  domains?: any
  targetUrl?: string
  createdAt?: Date
  updatedAt?: Date
}

interface UpdateSettingResponse {
  data?: Setting
  message: string
  status: number
}
