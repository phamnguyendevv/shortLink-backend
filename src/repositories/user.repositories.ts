import { PrismaClient } from '@prisma/client'
import { Rights } from '~/constants/rights'

const prisma = new PrismaClient()

export class AuthRepository {
  async createUser(data: CreateUserData) {
    const { email, username, password, rights, isVerifiedByEmail, teamId, code, targetUrl } = data
    console.log('targetUrl2', targetUrl)
    return await prisma.$transaction(async (transactionPrisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password,
          name: email, // Use username as the name or provide a default value
          rights: rights as Rights, // Ensure rights is cast to UserRight
          isVerifiedByEmail,
          teamId: teamId ? teamId : null, // Set teamId to null if not provided
          code: code || '' // Provide a default value for code if not provided
        }
      })

      // Create settings for the user
      await transactionPrisma.setting.create({
        data: {
          targetUrl: targetUrl || '', // Provide a default value for targetUrl if not provided
          user: { connect: { id: user.id } }
        }
      })
      return user
    })
  }

  async updateUser(email: string, data: { password: string }) {
    return await prisma.user.update({
      where: { email },
      data
    })
  }

  async findUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        settings: {
          include: {
            domains: {
              select: {
                domain: true
              }
            }
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            targetUrl: true
          }
        }
      }
    })

    // Map domains to an array of strings
    if (user?.settings?.domains) {
      ;(user.settings as any).domains = user.settings.domains.map((domainObj: { domain: string }) => domainObj.domain)
    }

    return user
  }

  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    })
  }

  async findUserByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { username }
    })
  }

  async createUserWithTeam(userData: CreateUserData, teamData: CreateTeamData) {
    try {
      return await prisma.$transaction(async (transactionPrisma) => {
        // Create the user first
        const newUser = await transactionPrisma.user.create({
          data: {
            ...userData,
            name: userData.username, // Use username as the name
            rights: userData.rights as Rights, // Ensure rights is cast to UserRight
            teamId: userData.teamId ?? null // Ensure teamId is null if not provided
          }
        })

        // Then create the team with the user as the creator
        const newTeam = await transactionPrisma.team.create({
          data: {
            ...teamData,
            creatorId: newUser.id,
            targetUrl: teamData.targetUrl ?? '' // Provide a default value for targetUrl
          }
        })

        // Update the user to associate them with the newly created team
        const updatedUser = await transactionPrisma.user.update({
          where: { id: newUser.id },
          data: { teamId: newTeam.id }
        })

        return { user: updatedUser, team: newTeam }
      })
    } catch (error) {
      console.error('Error in createUserWithTeam:', error)
      throw new Error('Failed to create user and team. Please try again.')
    }
  }
}

export const authRepository = new AuthRepository()
