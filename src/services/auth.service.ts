import HTTP_STATUS from '../constants/httpsStatus' // Adjust import paths as needed
import { comparePassword, hashPassword } from '../utils/password' // Assuming hashPassword is a utility function
import { authRepository } from '../repositories/user.repositories'
import { teamRepository } from '../repositories/team.repositories'
import { decoToken, generateToken, refreshTokens } from '../utils/jwt'
import { settingRepository } from '../repositories/setting.repositories'
import { logger } from '../utils/logger'
import { UserRole } from '../constants/enum'

const AuthService = {
  async register(data: CreateUserData): Promise<RegisterResponse> {
    const { roles } = data

    if (!roles) {
      return {
        message: 'Thiếu thông tin đăng kí',
        status: HTTP_STATUS.BAD_REQUEST
      }
    }

    // rights = ADMIN
    if (roles === UserRole.ADMIN) {
      return await this.registerAdmin(data)
    }
    if (roles === UserRole.LEADER) {
      return await this.registerLeader(data)
    }
    if (roles === UserRole.USER) {
      return await this.registerMember(data)
    }

    return {
      message: 'Quyền không hợp lệ',
      status: HTTP_STATUS.BAD_REQUEST
    }
  },

  async registerMember(data: CreateUserData): Promise<RegisterResponse> {
    try {
      const { username, email, password, teamId } = data
      const code =
        Array.from({ length: 5 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') +
        Math.floor(Math.random() * 10)

      if (!teamId) {
        return {
          message: 'Thiếu thông tin để tạo tài khoản',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }
      const userad = await authRepository.findUserById(teamId)
      if (!userad) {
        return {
          message: 'Team không tồn tại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }

      // Hash the password
      const hashedPassword = await hashPassword(password)

      // Create a new user
      const user = await authRepository.createUser({
        email,
        username,
        password: hashedPassword,
        roles: UserRole.USER,
        isVerifiedByEmail: false,
        teamId,
        code,
        targetUrl: ''
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
      const { username, email, password, roles } = data
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
        roles: roles,
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

  async registerLeader(data: RegisterWithTeamData): Promise<RegisterWithTeamResponse> {
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
        roles: UserRole.LEADER, // Creator of the team will have TEAM_ADMIN rights
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

  async updateUser(data: UpdateUserData, userId: number): Promise<any> {
    if (!data.domains && (!data.oldPassword || !data.newPassword) && !data.status) {
      return {
        message: 'Thiếu thông tin cập nhật',
        status: HTTP_STATUS.BAD_REQUEST
      }
    }
    try {
      const user = await authRepository.findUserById(userId)
      if (!user) {
        return {
          message: 'Người dùng không tồn tại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }

      if (data.domains) {
        return await this.updateDomains({ domains: data.domains }, userId)
      }

      if (data.oldPassword && data.newPassword) {
        return await this.updatePassword({ oldPassword: data.oldPassword, newPassword: data.newPassword }, userId)
      }

      if (data.status) {
        const updatedUser = await authRepository.updateUser(user.email, { status: data.status })
        if (!updatedUser) {
          return {
            message: 'Cập nhật trạng thái thất bại',
            status: HTTP_STATUS.BAD_REQUEST
          }
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser
        return {
          data: userWithoutPassword,
          message: 'Cập nhật trạng thái thành công',
          status: HTTP_STATUS.OK
        }
      }
    } catch (error) {
      logger.error('Update user error:', error) // Sử dụng logger thay vì console.error
      return {
        message: 'Cập nhật thông tin thất bại',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      }
    }
  },
  async updatePassword(data: UpdatePasswordData, userId: number): Promise<UpdateSettingResponse> {
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

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser
      return {
        data: userWithoutPassword,
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

  async updateDomains(data: UpdateSettingData, userId: number): Promise<UpdateSettingResponse> {
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
          message: 'Cập nhật domains thất bại',
          status: HTTP_STATUS.BAD_REQUEST
        }
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user
      return {
        data: userWithoutPassword,
        message: 'Cập nhật domains thành công',
        status: HTTP_STATUS.OK
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật domains:', error)
      return {
        message: 'Cập nhật domains thất bại',
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
