import HTTP_STATUS from "../constants/httpStatus.js";
import { Rights } from "../constants/rights.js";
import { TeamService } from "../services/teamService.js";
import { TeamRepository } from "../repositories/teamRepository.js";
import { ValidationError, NotFoundError } from "../errors/AppError.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const teamRepository = new TeamRepository();
const teamService = new TeamService(teamRepository);

let teamController = {
  createTeam: async (req, res, next) => {
    try {
      const id = req.user.id;
      const result = await teamService.createTeam(req.body, id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  getTeam: async (req, res, next) => {
    try {
      const result = await teamService.getTeam(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  updateTeam: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, status, targetUrl } = req.body;

      const result = await teamService.updateTeam(+id, {
        name,
        status,
        targetUrl,
      });

      return res.status(HTTP_STATUS.OK).json({
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  },

  removeUser: async (req, res, next) => {
    try {
      const result = await teamService.removeUser(
        req.params.id,
        req.body.userId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const result = await teamService.deleteUser(req.params.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  listTeam: async (req, res) => {
    try {
      const result = await teamService.listTeam();
      return res.status(HTTP_STATUS.OK).json({
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách team:", error);
    }
  },
};

export default teamController;
