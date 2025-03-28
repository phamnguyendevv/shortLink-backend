import HTTP_STATUS from "../constants/httpStatus.js";
import { Rights } from "../constants/rights.js";
import { AuthService } from "../services/authServices.js";
import { AuthRepository } from "../repositories/authRepository.js";
import { TeamRepository } from "../repositories/teamRepository.js";
import { decoToken, generateToken, refreshTokens } from "../utils/jwt.js";
import { hashPassword } from "../utils/password.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const authRepository = new AuthRepository();
const teamRepository = new TeamRepository();
const authService = new AuthService(authRepository, teamRepository);

let authController = {
  registerController: async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      return res.status(result.status || HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  },

  loginController: async (req, res) => {
    try {
      const user = req.user;

      // Kiểm tra xem user có tồn tại không
      if (!user) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: "Người dùng không tồn tại",
        });
      }

      // Tách các thuộc tính không cần thiết
      const { password, created_at, updated_at, ...usercustom } = user;

      // Tạo token và xử lý lỗi
      try {
        const accessToken = await generateToken(user);
        const refreshToken = await refreshTokens(user);
        const decod = await decoToken(accessToken);
        const exp = decod.exp;
        const token = { accessToken, refreshToken, exp };
        // Trả về response thành công
        return res.status(HTTP_STATUS.OK).json({
          message: "Đăng nhập thành công",
          data: {
            user: usercustom,
            token,
          },
        });
      } catch (tokenError) {
        console.error("Lỗi khi tạo token:", tokenError);
        return res.status(HTTP_STATUS.INTERNAL_SERVER).json({
          message: "Lỗi khi tạo token",
        });
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error.message || error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Đăng nhập thất bại",
      });
    }
  },

  refreshToken: async (req, res) => {
    const result = await authService.refreshToken(req.body);
    return res.status().json({
      message: result.message,
      data: result.data,
      status: result.status,
    });
  },

  changePassword: async (req, res) => {
    try {
      const result = await AuthService.changePassword(req.body);
      return res.status(HTTP_STATUS.OK).json({
        message: "Cập nhật mật khẩu thành công",
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật mật khẩu:", error.message || error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Cập nhật mật khẩu thất bại",
      });
    }
  },

  updateUser: async (req, res) => {
    try {
      const user = req.user;
      const { username, password } = req.body;
      const data = { id: user.id, username, password };
      const result = await AuthService.updateUser(data);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error.message || error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Cập nhật thông tin thất bại",
      });
    }
  },

  registerWithTeamController: async (req, res, next) => {
    try {
      const result = await authService.registerWithTeam(req.body);
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
