import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../utils/password.js";
import HTTP_STATUS from "../constants/httpStatus.js";
import { decoToken, generateToken, refreshTokens } from "../utils/jwt.js";
import { Rights } from "../constants/rights.js";
import { AuthRepository } from "../repositories/authRepository.js";
import {
  ValidationError,
  NotFoundError,
  AppError,
} from "../errors/AppError.js";

export class AuthService {
  constructor(authRepository, teamRepository) {
    this.authRepository = authRepository;
    this.teamRepository = teamRepository;
  }

  async register(data, adminId) {
    try {
      const { username, email, password } = data;
      let rights = data.rights;
      let teamId = null;
      const userad = await this.authRepository.findById(adminId);

      if (userad.rights === "TEAM_ADMIN") {
        rights = Rights.TEAM_MEMBER;
        const team = await this.teamRepository.findByCreatorId(adminId);
        teamId = team.id;
      }
      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = await this.authRepository.findByEmail(email);

      if (existingUser) {
        return {
          message: "Email đã tồn tại",
          status: HTTP_STATUS.BAD_REQUEST,
        };
      }

      // Mã hóa mật khẩu
      const hashedPassword = await hashPassword(password);

      // Tạo user mới
      const user = await this.authRepository.create({
        email,
        username,
        password: hashedPassword,
        rights,
        isVerifiedByEmail: false,
        teamId,
      });
      const dataUser = { ...user };
      delete dataUser.password;

      return {
        message: "Tạo tài khoản thành công",
        data: dataUser,
        status: HTTP_STATUS.CREATED,
      };
    } catch (error) {
      console.error("Lỗi khi tạo tài khoản:", error);
      return {
        message: "Tạo tài khoản thất bại",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }
  }

  async registerWithTeam(data) {
    try {
      const { username, email, password, teamName, targetUrl } = data;

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await this.authRepository.findByEmail(email);
      if (existingUser) {
        return {
          message: "Email đã tồn tại",
          status: HTTP_STATUS.BAD_REQUEST,
        };
      }

      // Mã hóa mật khẩu
      const hashedPassword = await hashPassword(password);

      // Chuẩn bị dữ liệu user
      const userDataToCreate = {
        email,
        username: username,
        password: hashedPassword,
        rights: "TEAM_ADMIN", // Người tạo team sẽ có quyền TEAM_ADMIN
        isVerifiedByEmail: false,
        status: "ACTIVE",
      };

      // Chuẩn bị dữ liệu team
      const teamData = {
        name: teamName || username,
        status: "ACTIVE",
        targetUrl: targetUrl,
      };

      // Gọi repository để tạo user và team trong một transaction
      const result = await this.authRepository.createUserWithTeam(
        userDataToCreate,
        teamData
      );

      // Loại bỏ password từ response
      const userResponse = { ...result.user };
      delete userResponse.password;

      return {
        message: "Tạo tài khoản và team thành công",
        data: {
          user: userResponse,
          team: result.team,
        },
        status: HTTP_STATUS.CREATED,
      };
    } catch (error) {
      console.error("Lỗi khi tạo tài khoản và team:", error);
      return {
        message: "Tạo tài khoản và team thất bại",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }
  }

  async refreshToken(data) {
    try {
      const { refreshToken } = data;

      // Kiểm tra refreshToken
      if (!refreshToken || typeof refreshToken !== "string") {
        return {
          message: "Token không hợp lệ hoặc đã hết hạn",
          status: HTTP_STATUS.BAD_REQUEST,
        };
      }

      // Giải mã refreshToken
      let decoded;
      try {
        decoded = await decoToken(refreshToken);
      } catch (error) {
        return {
          message: "Token không hợp lệ",
          status: HTTP_STATUS.BAD_REQUEST,
        };
      }

      // Kiểm tra decoded.id
      if (!decoded.id) {
        return {
          message: "Token không hợp lệ",
          status: HTTP_STATUS.BAD_REQUEST,
        };
      }

      // Tìm kiếm người dùng
      const user = await this.authRepository.findById(decoded.id);

      if (!user) {
        return {
          message: "Người dùng không tồn tại",
          status: HTTP_STATUS.BAD_REQUEST,
        };
      }

      // Tạo accessToken mới
      let accessToken;
      try {
        const { iat, exp, ...data } = decoded;
        accessToken = await generateToken(data);
      } catch (error) {
        console.error("Lỗi khi tạo accessToken:", error);
        return {
          message: "Lỗi khi tạo accessToken",
          status: HTTP_STATUS.BAD_REQUEST,
        };
      }

      // Xóa thông tin nhạy cảm khỏi user
      const { password, ...dataUser } = user;

      // Trả về response
      return {
        message: "Lấy token thành công",
        data: {
          user: dataUser,
          token: { accessToken, refreshToken },
          exp: decoded.exp,
        },
        status: HTTP_STATUS.OK,
      };
    } catch (error) {
      console.error("Lỗi khi lấy token:", error.message || error);
      return {
        message: "Lấy token thất bại",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }
  }

  async updateUser(data) {
    try {
      const { id, username, password } = data;
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.update({
        where: { id },
        data: {
          username,
          password: hashedPassword,
        },
      });
      return {
        data: user,
        message: "Cập nhật user thành công",
      };
    } catch (error) {
      return {
        message: "Cập nhật user thất bại",
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }
  }
}
