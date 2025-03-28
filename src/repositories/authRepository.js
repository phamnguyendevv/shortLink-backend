import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AuthRepository {
  async create(data) {
    return prisma.user.create({
      data,
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async createUserWithTeam(userData, teamData) {
    return prisma.$transaction(async (prisma) => {
      // Tạo user trước
      const newUser = await prisma.user.create({
        data: userData,
      });

      // Sau đó tạo team với user là creator
      const newTeam = await prisma.team.create({
        data: {
          ...teamData,
          creatorId: newUser.id,
        },
      });

      // Cập nhật user để thuộc về team vừa tạo
      const updatedUser = await prisma.user.update({
        where: { id: newUser.id },
        data: { teamId: newTeam.id },
      });

      return { user: updatedUser, team: newTeam };
    });
  }
}

export default AuthRepository;
