import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
const prisma = new PrismaClient()

export class LinkRepository {
  async createLink(data: any) {
    const { userId, targetUrl, mask, path, hid } = data
    try {
      const link = await prisma.link.create({
        data: {
          user: { connect: { id: userId } },
          targetUrl,
          mask,
          path,
          hid
        }
      })
      return link
    } catch (error) {
      console.error('Error creating link:', error)
      throw new Error('Failed to create link')
    }
  }

  async findLinkById(id: number) {
    return await prisma.link.findUnique({
      where: { id }
    })
  }

  async updateLink(id: number, data: any) {
    return await prisma.link.update({
      where: { id },
      data
    })
  }

  async deleteLink(id: number) {
    return await prisma.link.delete({
      where: { id }
    })
  }
  async findLinkByPath(path: string) {
    return await prisma.link.findFirst({
      where: { path: path } // Replace '0' and 'path' with appropriate values
    })
  }
}

export const linkRepository = new LinkRepository()
