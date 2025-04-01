import HTTP_STATUS from '../constants/httpsStatus' // Adjust import paths as needed
import { Rights } from '../constants/rights'
import { comparePassword, hashPassword } from '../utils/password' // Assuming hashPassword is a utility function
import { authRepository } from '../repositories/user.repositories'
import { teamRepository } from '../repositories/team.repositories'
import { decoToken, generateToken, refreshTokens } from '../utils/jwt'
import { settingRepository } from '../repositories/setting.repositories'

const AuthService = {
  async register(data: CreateUserData, adminId: number): Promise<RegisterResponse> {
    try {
      const { username, email, password } = data
      const code =
        Array.from({ length: 5 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') +
        Math.floor(Math.random() * 10)
      let rights = data.rights

      let teamId: number | null = null

      let targetUrl = undefined

      const userad = await authRepository.findUserById(adminId)

      if (userad?.rights === 'TEAM_ADMIN') {
        rights = Rights.TEAM_MEMBER
        const team = await teamRepository.findTeamByCreatorId(adminId)
        teamId = team?.id || null
        targetUrl = team?.targetUrl
      }
      if (userad?.rights === 'ADMIN') {
        rights = data.rights
      }

      // Hash the password
      const hashedPassword = await hashPassword(password)

      // Create a new user
      const user = await authRepository.createUser({
        email,
        username,
        password: hashedPassword,
        rights: rights || '',
        isVerifiedByEmail: false,
        teamId,
        code,
        targetUrl
      })

      const { password: userPassword, ...dataUser } = user

      return {
        message: 'Tạo tài khoản thành công',
        data: dataUser,
        status: HTTP_STATUS.CREATED
      }
    } catch (error) {
      console.error('Lỗi khi tạo tài khoản:', error)
      return {
        message: 'Tạo tài khoản thất bại',
        status: HTTP_STATUS.BAD_REQUEST
      }
    }
  },
  async registerAdmin(data: CreateUserData): Promise<RegisterResponse> {
    try {
      const { username, email, password } = data
      const code =
        Array.from({ length: 5 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') +
        Math.floor(Math.random() * 10)

      // Hash the password
      const hashedPassword = await hashPassword(password)

      // Create a new user with ADMIN rights
      const user = await authRepository.createUser({
        email,
        username,
        password: hashedPassword,
        rights: Rights.ADMIN,
        isVerifiedByEmail: false,
        code
      })

      const { password: userPassword, ...dataUser } = user

      return {
        message: 'Tạo tài khoản thành công',
        data: dataUser,
        status: HTTP_STATUS.CREATED
      }
    } catch (error) {
      console.error('Lỗi khi tạo tài khoản:', error)
      return {
        message: 'Tạo tài khoản thất bại',
        status: HTTP_STATUS.BAD_REQUEST
      }
    }
  },

  async registerWithTeam(data: RegisterWithTeamData): Promise<RegisterWithTeamResponse> {
    try {
      const { username, email, password, teamName, targetUrl } = data
      const code =
        Array.from({ length: 5 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') +
        Math.floor(Math.random() * 10)

      // Check if email already exists
      const existingUser = await authRepository.findUserByEmail(email)
      if (existingUser) {
        return {
          message: 'Email đã tồn tại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }

      // Hash the password
      const hashedPassword = await hashPassword(password)

      // Prepare user data
      const userDataToCreate = {
        email,
        username,
        password: hashedPassword,
        rights: Rights.TEAM_ADMIN, // Creator of the team will have TEAM_ADMIN rights
        isVerifiedByEmail: false,
        status: 'ACTIVE',
        code: code
      }

      // Prepare team data
      const teamData = {
        name: teamName || username,
        status: 'ACTIVE',
        targetUrl
      }

      // Create user and team in a transaction
      const result = await authRepository.createUserWithTeam(userDataToCreate, teamData)

      // Remove password from response
      const { user, team } = result
      const { password: userPassword, ...userResponse } = user

      return {
        message: 'Tạo tài khoản và team thành công',
        data: {
          user: userResponse,
          team: team
        },
        status: HTTP_STATUS.CREATED
      }
    } catch (error) {
      console.error('Lỗi khi tạo tài khoản và team:', error)
      return {
        message: 'Tạo tài khoản và team thất bại',
        status: HTTP_STATUS.BAD_REQUEST
      }
    }
  },

  async refreshToken(data: RefreshTokenData): Promise<RefreshTokenResponse> {
    try {
      const { refresh_token } = data
      const decoded = await decoToken(refresh_token)
      const userId = decoded.id

      // Check if user exists
      const user = await authRepository.findUserById(userId)
      if (!user) {
        return {
          message: 'Người dùng không tồn tại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }

      // Generate new tokens
      const accessToken = await generateToken(user)
      const newRefreshToken = await refreshTokens(user)
      const exp = decoded.exp
      const { password, ...userWithoutPassword } = user

      return {
        message: 'Làm mới token thành công',
        data: {
          user: userWithoutPassword,
          token: {
            accessToken: accessToken,
            refreshToken: newRefreshToken,
            exp
          }
        },
        status: HTTP_STATUS.OK
      }
    } catch (error) {
      console.error('Lỗi khi làm mới token:', error)
      return {
        message: 'Làm mới token thất bại',
        status: HTTP_STATUS.BAD_REQUEST
      }
    }
  },
  async updatePassword(data: UpdatePasswordData, userId: number): Promise<RegisterResponse> {
    try {
      const { oldPassword, newPassword } = data
      const user = await authRepository.findUserById(userId)
      if (!user) {
        return {
          message: 'Người dùng không tồn tại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }
      // Check if the old password is correct
      const isPasswordValid = await comparePassword(oldPassword, user.password)

      if (!isPasswordValid) {
        return {
          message: 'Mật khẩu cũ không đúng',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword)
      // Update the user's password
      const updatedUser = await authRepository.updateUser(user.email, { password: hashedPassword })
      if (!updatedUser) {
        return {
          message: 'Cập nhật mật khẩu thất bại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }
      return {
        message: 'Cập nhật mật khẩu thành công',
        status: HTTP_STATUS.OK
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật mật khẩu:', error)
      return {
        message: 'Cập nhật mật khẩu thất bại',
        status: HTTP_STATUS.BAD_REQUEST
      }
    }
  },

  async updateSetting(data: UpdateSettingData, userId: number): Promise<UpdateSettingResponse> {
    try {
      const { domains } = data
      const user = await authRepository.findUserById(userId)
      if (!user) {
        return {
          message: 'Người dùng không tồn tại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }
      // Update the user's settings
      const updatedUser = await settingRepository.updateSetting(userId, {
        domains
      })
      if (!updatedUser) {
        return {
          message: 'Cập nhật thông tin thất bại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }
      return {
        data: { ...updatedUser, targetUrl: updatedUser.targetUrl ?? undefined },
        message: 'Cập nhật thông tin thành công',
        status: HTTP_STATUS.OK
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error)
      return {
        message: 'Cập nhật thông tin thất bại',
        status: HTTP_STATUS.BAD_REQUEST
      }
    }
  },
  async getMe(userId: number): Promise<RegisterResponse> {
    try {
      const user = await authRepository.findUserById(userId)
      if (!user) {
        return {
          message: 'Người dùng không tồn tại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }
      const { password, ...dataUser } = user
      return {
        message: 'Lấy thông tin người dùng thành công',
        data: dataUser,
        status: HTTP_STATUS.OK
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error)
      return {
        message: 'Lấy thông tin người dùng thất bại',
        status: HTTP_STATUS.BAD_REQUEST
      }
    }
  }
}

export default AuthService
