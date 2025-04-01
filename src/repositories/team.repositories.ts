import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class TeamRepository {
  createTeam = async (data: any) => {
    const { name, status, targetUrl } = data
    return await prisma.team.create({
      data: {
        name,
        status,
        targetUrl,
        creator: {
          connect: { id: data.creatorId } // Assuming `creatorId` is passed in `data`
        }
      }
    })
  }
  findByCreatorId = async (creatorId: number) => {
    return await prisma.team.findFirst({
      where: { creatorId },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            username: true,
            settings: {
              select: {
                id: true,
                targetUrl: true,
                domains: {
                  select: {
                    domain: true
                  }
                }
              }
            },
            links: {
              select: {
                id: true,
                hid: true,
                mask: true,
                targetUrl: true,
                clicks: {
                  select: {
                    id: true,
                    ipStatus: true,
                    userAgent: true,
                    isBot: true,
                    country: true,
                    city: true,
                    region: true,
                    isOnline: true,
                    destination: true,
                    botScore: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        }
      }
    })
  }
  findTeamByCreatorId = async (id: number) => {
    return await prisma.team.findUnique({
      where: { creatorId: id }, // Use the team's ID to find the team
      include: {
        members: {
          select: {
            id: true,
            email: true,
            username: true,
            settings: {
              select: {
                id: true,
                targetUrl: true,
                domains: {
                  select: {
                    domain: true
                  }
                }
              }
            },
            links: {
              select: {
                id: true,
                hid: true,
                mask: true,
                targetUrl: true,

                clicks: {
                  select: {
                    id: true,
                    ipStatus: true,
                    userAgent: true,
                    isBot: true,
                    country: true,
                    city: true,
                    region: true,
                    isOnline: true,
                    destination: true,
                    botScore: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        }
      }
    })
  }
  findTeamByName = async (name: string) => {
    return await prisma.team.findFirst({
      where: { name }
    })
  }
  findTeamByTargetUrl = async (targetUrl: string) => {
    return await prisma.team.findFirst({
      where: { targetUrl }
    })
  }
  findAllTeam = async () => {
    return await prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            username: true,
            email: true,
            settings: {
              select: {
                targetUrl: true,
                domains: {
                  select: {
                    domain: true
                  }
                }
              }
            },
            links: {
              select: {
                id: true,
                hid: true,
                mask: true,
                targetUrl: true,
                clicks: {
                  select: {
                    id: true,
                    ipStatus: true,
                    userAgent: true,
                    isBot: true,
                    country: true,
                    city: true,
                    region: true,
                    isOnline: true,
                    destination: true,
                    botScore: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        }
      }
    })
  }

  updateTeam = async (id: number, data: Prisma.TeamUpdateInput) => {
    await prisma.team.update({
      where: { id },
      data
    })
    return prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            username: true,
            settings: {
              select: {
                id: true,
                targetUrl: true,
                domains: {
                  select: {
                    domain: true
                  }
                }
              }
            },
            links: {
              select: {
                id: true,
                hid: true,
                mask: true,
                targetUrl: true,
                clicks: {
                  select: {
                    id: true,
                    ipStatus: true,
                    userAgent: true,
                    isBot: true,
                    country: true,
                    city: true,
                    region: true,
                    isOnline: true,
                    destination: true,
                    botScore: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        }
      }
    })
  }
  removeMember = async (teamId: number, memberId: number) => {
    return await prisma.$transaction(async (transactionPrisma) => {
      // Step 1: Disconnect the member from the team
      await transactionPrisma.team.update({
        where: { id: teamId },
        data: {
          members: {
            disconnect: { id: memberId }
          }
        }
      })

      // Step 2: Delete the user from the database
      await transactionPrisma.user.delete({
        where: { id: memberId }
      })

      // Step 3: Fetch the updated team data
      const updatedTeam = await transactionPrisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        }
      })

      return updatedTeam
    })
  }
}

export const teamRepository = new TeamRepository()
