import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class SettingRepository {
  async updateSetting(userId: number, data: any) {
    const { domains } = data

    // Check if the record exists
    const existingSetting = await prisma.setting.findUnique({
      where: { userId: userId }
    })
    if (!existingSetting) {
      // Create a new setting if it doesn't exist
      const newSetting = await prisma.setting.create({
        data: {
          userId,
          targetUrl: ''
        }
      })

      // Create domains for the new setting
      if (domains && domains.length > 0) {
        const domainData = domains.map((domain: string) => ({
          domain,
          settingId: newSetting.id // Foreign key relationship
        }))
        await prisma.domain.createMany({
          data: domainData
        })
      }

      // Return the newly created setting with domains
      return await prisma.setting.findUnique({
        where: { userId: userId },
        include: {
          domains: {
            select: {
              domain: true
            }
          }
        }
      })
    } else {
 

      // Delete existing domains for the setting
      await prisma.domain.deleteMany({
        where: { settingId: existingSetting.id }
      })

      // Create new domains for the updated setting
      if (domains && domains.length > 0) {
        const domainData = domains.map((domain: string) => ({
          domain,
          settingId: existingSetting.id // Foreign key relationship
        }))
        await prisma.domain.createMany({
          data: domainData
        })
      }

      // Return the updated setting with domains
      return await prisma.setting.findUnique({
        where: { userId: userId },
        include: {
          domains: {
            select: {
              domain: true
            }
          }
        }
      })
    }
  }

  async findSettingById(id: number) {
    return await prisma.team.findUnique({
      where: { id }
    })
  }

  async findSettingByTargetUrl(targetUrl: string) {
    return await prisma.team.findFirst({
      where: { targetUrl }
    })
  }
  updateMemberTargetUrl = async (memberId: number, targetUrl: string) => {
    // Check if the setting exists for the given memberId
    const existingSetting = await prisma.setting.findUnique({
      where: { userId: memberId }
    })

    if (!existingSetting) {
      // Create a new setting if it doesn't exist
      return await prisma.setting.create({
        data: {
          userId: memberId,
          targetUrl
        }
      })
    }

    // Update the existing setting
    return await prisma.setting.update({
      where: { userId: memberId },
      data: { targetUrl }
    })
  }
}
export const settingRepository = new SettingRepository()
