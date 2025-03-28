import { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../errors/AppError.js";

const prisma = new PrismaClient();

export class TeamRepository {
  async create(data, creatorId) {
    return prisma.team.create({
      data: {
        ...data,
        creatorId,
      },
      include: {
        users: true,
      },
    });
  }

  async findById(id) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!team) {
      throw new NotFoundError("Team không tồn tại");
    }

    return team;
  }

  async update(id, data) {
    return prisma.team.update({
      where: { id },
      data,
      include: {
        users: true,
      },
    });
  }

  async delete(id) {
    return prisma.team.delete({
      where: { id },
    });
  }

  async removeUser(teamId, userId) {
    return prisma.team.update({
      where: { id: teamId },
      data: {
        users: {
          disconnect: { id: userId },
        },
      },
      include: {
        users: true,
      },
    });
  }

  async deleteUser(userId) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }

  async findByCreatorId(creatorId) {
    return prisma.team.findFirst({
      where: {
        creatorId,
      },
      include: {
        users: true,
      },
    });
  }
}
