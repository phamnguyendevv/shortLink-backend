import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../utils/password.js";
import HTTP_STATUS from "../constants/httpStatus.js";
import { decoToken, generateToken, refreshTokens } from "../utils/jwt.js";
import { ValidationError, NotFoundError } from "../errors/AppError.js";
const prisma = new PrismaClient();

export class TeamService {
  constructor(teamRepository) {
    this.teamRepository = teamRepository;
  }

  async createTeam(data, id) {
    if (!data.name || !data.description) {
      throw new ValidationError("Tên và mô tả là bắt buộc");
    }

    const team = await this.teamRepository.create(data, id);
    return {
      message: "Tạo team thành công",
      data: team,
    };
  }

  async getTeam(id) {
    const team = await this.teamRepository.findById(id);
    return {
      message: "Lấy thông tin team thành công",
      data: team,
    };
  }

  async removeUser(teamId, userId) {
    if (!teamId || !userId) {
      throw new ValidationError("Team ID và User ID là bắt buộc");
    }

    const team = await this.teamRepository.removeUser(teamId, userId);
    return {
      message: "Xóa user khỏi team thành công",
      data: team,
    };
  }

  async deleteUser(userId) {
    if (!userId) {
      throw new ValidationError("User ID là bắt buộc");
    }

    await this.teamRepository.deleteUser(userId);
    return {
      message: "Xóa user thành công",
    };
  }

  async updateTeam(id, data) {
    try {
      if (!id) {
        throw new ValidationError("Team ID là bắt buộc");
      }

      const team = await this.teamRepository.update(id, data);

      return {
        message: "Cập nhật team thành công",
        data: team,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error("Cập nhật team thất bại");
    }
  }
}

export default TeamService;
