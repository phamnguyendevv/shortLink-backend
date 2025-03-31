import { checkIpStatus } from '../utils/ipStatus'
import { linkRepository } from '../repositories/link.repositories'
import { authRepository } from '../repositories/user.repositories'
import { createShortLink, validateUrl } from '../utils/checkLink'
import geoip from 'geoip-lite'
import { logger } from '../utils/logger'
const LinkService = {
  async createLink(userId: number, data: any): Promise<any> {
    const { mask, targetUrl } = data
    const hid =
      Array.from({ length: 5 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') +
      Math.floor(Math.random() * 10)
    const user = await authRepository.findUserById(userId)
    const code = user?.code

    const domains = user?.settings?.domains
    if (!targetUrl || !validateUrl(targetUrl)) {
      return {
        message: 'Invalid target URL',
        status: 400
      }
    }

    if (!domains || domains.length === 0) {
      return {
        message: 'No domains available',
        status: 400
      }
    }

    const shortLink = createShortLink(domains, targetUrl, code || '')
    const path = shortLink.path
    const dataLink = {
      userId,
      targetUrl,
      mask: String(mask),
      path,
      hid
    }

    const link = await linkRepository.createLink(dataLink)

    return {
      message: 'Link created successfully',
      data: {
        id: link.id,
        mask: link.mask,
        hid: link.hid,
        creatorId: link.creatorId,
        teamId: user?.teamId,
        targetUrl,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt
      },
      status: 200
    }
  },

  async getLink(path: string, ip: any): Promise<any> {
    const pathLink = await linkRepository.findLinkByPath(path)
    if (!pathLink) {
      return {
        message: 'Link not found',
        status: 404
      }
    }
    const targetUrl = pathLink.targetUrl

    // Track click data cho người dùng thật
    const userAgentString =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'

    const isBot = false // Đã xác định là người dùng thật

    let geo = { country: 'unknown', city: 'unknown', region: 'unknown' }
    try {
      const geoLookup = geoip.lookup(ip)
      if (geoLookup) {
        geo = {
          country: geoLookup.country || 'unknown',
          city: geoLookup.city || 'unknown',
          region: geoLookup.region || 'unknown'
        }
      }
    } catch (error) {
      console.error('Geolocation error:', error)
      return {
        message: 'Geolocation error',
        status: 500
      }
    }

    const ipStatus = await checkIpStatus(ip)
    logger.info('ipStatus', ipStatus)

    const clickData = {
      linkId: pathLink.id,
      country: geo.country,
      city: geo.city,
      region: geo.region,
      isOnline: true,
      destination: targetUrl,
      view_count: 1,
      ipStatus: ipStatus,
      isBot: isBot,
      geo: geo,
      botScore: 10
    }

    return {
      message: 'Link found',
      data: {
        id: pathLink.id,
        hid: pathLink.hid,
        mask: pathLink.mask,
        targetUrl: pathLink.targetUrl,
        geoip: geo,
        createdAt: pathLink.createdAt,
        updatedAt: pathLink.updatedAt
      },
      status: 200
    }
  }
}

export default LinkService
