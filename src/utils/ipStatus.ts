import ping from 'ping'
import geoip from 'geoip-lite'
import { Reader } from 'maxmind'
import { CityResponse } from 'maxmind'

import axios from 'axios'

interface GeoInfo {
  country?: string
  city?: string
  region?: string
  timezone?: string
  ll?: [number, number]
  accuracy_radius?: number
  postal?: string
  org?: string
  source?: string
}

export const getExternalGeoData = async (ip: string): Promise<GeoInfo | null> => {
  try {
    // Use ipapi.co as the primary external API
    const response = await axios.get(`https://ipapi.co/${ip}/json/`)
    if (response.data && !response.data.error) {
      return {
        country: response.data.country_name || response.data.country || 'unknown',
        city: response.data.city || 'unknown',
        region: response.data.region || 'unknown',
        timezone: response.data.timezone || 'unknown',
        ll: [parseFloat(response.data.latitude) || 0, parseFloat(response.data.longitude) || 0],
        org: response.data.org || response.data.asn || '',
        postal: response.data.postal || '',
        source: 'ipapi.co'
      }
    }
  } catch (error) {
    console.error(`Error with ipapi.co for IP ${ip}:`, error instanceof Error ? error.message : 'Unknown error')
  }

  // Fallback to ipinfo.io if ipapi.co fails
  try {
    const backupResponse = await axios.get(`https://ipinfo.io/${ip}/json`)
    if (backupResponse.data) {
      const loc = backupResponse.data.loc ? backupResponse.data.loc.split(',') : [0, 0]
      return {
        country: backupResponse.data.country || 'unknown',
        city: backupResponse.data.city || 'unknown',
        region: backupResponse.data.region || 'unknown',
        timezone: backupResponse.data.timezone || 'unknown',
        ll: [parseFloat(loc[0]) || 0, parseFloat(loc[1]) || 0],
        org: backupResponse.data.org || '',
        postal: backupResponse.data.postal || '',
        source: 'ipinfo.io'
      }
    }
  } catch (backupError) {
    console.error(
      `Error with ipinfo.io for IP ${ip}:`,
      backupError instanceof Error ? backupError.message : 'Unknown error'
    )
  }

  // Return null if all external APIs fail
  return null
}
// Constants
const IP_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Interfaces
interface GeoInfo {
  country?: string
  city?: string
  region?: string
  timezone?: string
  ll?: [number, number]
  accuracy_radius?: number
  postal?: string
  org?: string
  source?: string
}

interface NetworkInfo {
  isp: string
  isProxy: boolean
  isVpn: boolean
  isDC: boolean // Data Center
  isTor: boolean
  isHosting: boolean
  organization: string
}

interface IpStatus {
  isOnline: boolean
  message: string
  type: 'ipv4' | 'ipv6' | 'private'
  isPrivate: boolean
  pingTime?: number
  geoSource?: string
  isp: string
  isProxy: boolean
  isVpn: boolean
  isDC: boolean
  isTor: boolean
  isHosting: boolean
  organization: string
  geo: GeoInfo | null
  raw?: any
  error?: boolean
}

interface CacheEntry {
  timestamp: number
  status: IpStatus
}

// Cache
const ipStatusCache = new Map<string, CacheEntry>()

// Global variables

let geoip2Reader: Reader<CityResponse> | null = null as Reader<CityResponse> | null

export const checkIpStatus = async (ip: string): Promise<IpStatus> => {
  try {
    // Check cache first
    if (ipStatusCache.has(ip)) {
      const cachedData = ipStatusCache.get(ip)
      const now = Date.now()

      // If cache is still valid
      if (cachedData && now - cachedData.timestamp < IP_CACHE_TTL) {
        return cachedData.status
      }

      // Cache expired, delete it
      ipStatusCache.delete(ip)
    }

    // Check for private or special IPs
    if (
      ip === 'unknown' ||
      ip === 'localhost' ||
      ip === '127.0.0.1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.2') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.') ||
      ip.startsWith('169.254.') ||
      ip.startsWith('::1') ||
      ip.startsWith('fe80::')
    ) {
      const status: IpStatus = {
        isOnline: false,
        message: 'Local/Private IP',
        type: 'private',
        isPrivate: true,
        isp: 'Local Network',
        isProxy: false,
        isVpn: false,
        isDC: false,
        isTor: false,
        isHosting: false,
        organization: 'Local Network',
        geo: null
      }

      // Save to cache
      ipStatusCache.set(ip, {
        timestamp: Date.now(),
        status
      })

      return status
    }

    // Collect network information
    let networkInfo: NetworkInfo = {
      isp: 'Unknown',
      isProxy: false,
      isVpn: false,
      isDC: false,
      isTor: false,
      isHosting: false,
      organization: 'Unknown'
    }

    // Use GeoIP2 if available
    let geoInfo: GeoInfo | null = null
    let geoSource = 'unknown'

    if (geoip2Reader) {
      try {
        const geoip2Result = geoip2Reader.get(ip)
        if (geoip2Result) {
          geoInfo = {
            country: geoip2Result.country?.iso_code || 'unknown',
            city: geoip2Result.city?.names?.en || 'unknown',
            region: geoip2Result.subdivisions?.[0]?.names?.en || 'unknown',
            timezone: geoip2Result.location?.time_zone || 'unknown',
            ll: [geoip2Result.location?.latitude || 0, geoip2Result.location?.longitude || 0],
            accuracy_radius: geoip2Result.location?.accuracy_radius,
            postal: geoip2Result.postal?.code || '',
            org: geoip2Result.traits?.autonomous_system_organization || ''
          }
          geoSource = 'maxmind-geoip2'
        }
      } catch (error) {
        console.log(`IP ${ip}: Failed to fetch GeoIP2 data, trying geoip-lite...`)
      }
    }

    // Fallback to geoip-lite if GeoIP2 fails
    if (!geoInfo) {
      geoInfo = geoip.lookup(ip)
      geoSource = 'geoip-lite'
    }

    // If geoInfo is incomplete, try external APIs
    if (!geoInfo || !geoInfo.country || geoInfo.country === 'unknown' || !geoInfo.city || geoInfo.city === 'unknown') {
      console.log(`IP ${ip}: Incomplete geo data, trying external APIs...`)
      const externalGeo = await getExternalGeoData(ip)

      if (externalGeo) {
        geoInfo = externalGeo
        geoSource = externalGeo.source || 'external-api'
        console.log(`IP ${ip}: Geo data fetched from ${geoSource}`)
      }
    }

    // Check if IPv6
    const isIpv6 = ip.includes(':')

    // Ping options
    const pingOptions = {
      timeout: 2,
      extra: isIpv6 ? ['-6', '-c', '1'] : ['-c', '1'],
      v6: isIpv6
    }

    // Perform ping
    const res = await ping.promise.probe(ip, pingOptions)

    // Build detailed result
    const status: IpStatus = {
      isOnline: res.alive,
      message: res.alive ? `Response time: ${res.time}ms` : 'No response',
      type: isIpv6 ? 'ipv6' : 'ipv4',
      isPrivate: false,
      geoSource: geoSource,
      ...networkInfo,
      geo: geoInfo,
      raw: res
    }

    // Save to cache
    ipStatusCache.set(ip, {
      timestamp: Date.now(),
      status
    })

    return status
  } catch (error) {
    console.error(`Error checking IP status for ${ip}:`, error)

    // Cache error result to avoid repeated failures
    const status: IpStatus = {
      isOnline: false,
      message: `Error checking status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: true,
      isPrivate: false,
      isp: 'Unknown',
      isProxy: false,
      isVpn: false,
      isDC: false,
      isTor: false,
      isHosting: false,
      organization: 'Unknown',
      type: 'ipv4',
      geo: null
    }

    ipStatusCache.set(ip, {
      timestamp: Date.now(),
      status
    })

    return status
  }
}
