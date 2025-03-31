import validator from 'validator'
import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { getClientIp } from 'request-ip'
import { logger } from './logger'
// Extend the Request interface to include the session property
declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      jsToken?: string
      fingerprint?: string
      botScore?: number
      requestTimestamps?: number[]
      [key: string]: any // Allow other properties in the session object
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    fingerprint?: string
    botScore?: number
    requestTimestamps?: number[]
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    isBot?: boolean
    botReason?: string[]
    botScore?: number
  }
}

export const validateUrl = (url: string): boolean => {
  // Validate the URL format
  if (
    !validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true
    })
  ) {
    return false
  }

  // Check against the whitelist
  const whitelist = process.env.URL_WHITELIST ? process.env.URL_WHITELIST.split(',') : []
  if (whitelist.length > 0) {
    return whitelist.some((domain) => url.includes(domain))
  }

  return true
}

export const createShortLink = (domains: any, targetUrl: string, code: string): any => {
  const length = Math.floor(Math.random() * 5) + 8
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  const randomPath =
    Array.from(randomValues)
      .map((value) => (value % 36).toString(36))
      .join('')
      .substring(0, length)
      .toUpperCase() + code

  // Pick a random domain from the provided list
  const domainList = (Array.isArray(domains) ? domains : [domains]).map((d) => d.trim()).filter((d) => d)
  const domain = domainList[Math.floor(Math.random() * domainList.length)]

  // Create the short URL ID (domain + path)
  const shortUrlId = `${domain}/${randomPath}`
  return {
    shortUrlId,
    path: randomPath
  }
}

export const checkJavaScript = (req: Request, res: Response, next: NextFunction): void => {
  const token = crypto.randomBytes(32).toString('hex')
  req.session = req.session ?? {} // Ensure `req.session` is initialized
  req.session.jsToken = token // Ensure `req.session` is properly typed in your project
  res.cookie('jsCheck', token, { httpOnly: true })
  next()
}

// Utility functions (replace with your actual implementations)
const generateFingerprint = (req: Request): string => {
  // Generate a unique fingerprint for the request
  return `${req.headers['user-agent'] || ''}-${getClientIp(req)}`
}

const calculateBotScore = (req: Request): number => {
  // Calculate a bot score based on request properties
  return 0 // Replace with your actual bot score calculation logic
}

const checkMouseMovement = (mouseMovements: any): { valid: boolean; reason?: string } => {
  // Validate mouse movements
  return { valid: true } // Replace with your actual validation logic
}

export const advancedBotDetection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ip = getClientIp(req) || 'unknown'
  const userAgent = req.headers['user-agent'] || ''
  const fingerprint = generateFingerprint(req)
  let botScore = calculateBotScore(req)

  // Save information to session
  req.session = req.session ?? {}
  req.session.fingerprint = fingerprint
  req.session.botScore = botScore
  req.session.requestTimestamps = req.session.requestTimestamps || []
  req.session.requestTimestamps.push(Date.now())

  // Limit the timestamps array to the last 10 entries
  if (req.session.requestTimestamps.length > 10) {
    req.session.requestTimestamps.shift()
  }

  // Check request frequency
  const timestamps = req.session.requestTimestamps
  if (timestamps.length >= 3) {
    const intervals = []
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1])
    }

    // Calculate mean and standard deviation of intervals
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const stdDev = Math.sqrt(intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length)

    // If the standard deviation is too small and mean is low, it might be a bot
    if (stdDev < 50 && mean < 1000) {
      await logViolation(ip, userAgent, 'Suspiciously uniform request timing')
      botScore += 30
    }
  }

  // Check mouse movements if provided
  if (req.body && req.body.mouseMovements) {
    const movementCheck = checkMouseMovement(req.body.mouseMovements)
    if (!movementCheck.valid) {
      await logViolation(ip, userAgent, `Suspicious mouse movements: ${movementCheck.reason}`)
      botScore += 30
    }
  }

  // If botScore is too high, mark as a bot but do not block
  if (botScore >= 70) {
    req.isBot = true
    req.botReason = [`High bot score (${botScore})`]
  }

  // Save botScore to the request for use in other middleware
  req.botScore = botScore

  next()
}

export const detectSuspiciousRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ip = getClientIp(req) || 'unknown'
  const userAgent = req.headers['user-agent'] || ''
  const acceptLanguage = req.headers['accept-language']
  const jsToken = req.cookies?.jsCheck

  // Use botScore if already calculated
  const botScore = req.botScore || 0

  // Initialize bot detection properties
  req.isBot = false
  req.botScore = botScore
  req.botReason = []

  // Check JavaScript - handle first request specially
  if (!jsToken) {
    req.session = req.session ?? {} // Ensure req.session is initialized
    if (!req.session.requestCount || req.session.requestCount <= 1) {
      req.session.requestCount = (req.session.requestCount || 0) + 1
      console.log(`First request from IP ${ip}, setting cookie`)
    } else {
      await logViolation(ip, userAgent, 'No cookie support after multiple requests')
      req.isBot = true
      req.botReason.push('No cookie support')
    }
    return next()
  } else if (jsToken !== (req.session = req.session ?? {}).jsToken) {
    await logViolation(ip, userAgent, 'JavaScript check failed')
    req.isBot = true
    req.botReason.push('JavaScript check failed')
    return next()
  }

  // Check Accept-Language header
  if (!acceptLanguage || acceptLanguage === '*/*') {
    await logViolation(ip, userAgent, 'Invalid Accept-Language header')
    req.isBot = true
    req.botReason.push('Invalid Accept-Language header')
    return next()
  }

  // Check request frequency
  if (req.session.requestTimestamps && req.session.requestTimestamps.length >= 2) {
    const lastTwoRequests = req.session.requestTimestamps.slice(-2)
    const timeDiff = lastTwoRequests[1] - lastTwoRequests[0]
    if (timeDiff < 100) {
      await logViolation(ip, userAgent, 'Requests too close together')
      req.isBot = true
      req.botReason.push('Requests too close together')
      return next()
    }
  }

  // Check User-Agent
  if (!userAgent || userAgent.length < 10) {
    await logViolation(ip, userAgent, 'Missing or short User-Agent')
    req.isBot = true
    req.botReason.push('Missing or short User-Agent')
    return next()
  }

  // Bot detection based on botScore and User-Agent
  if (botScore >= 50 || isBotUA(userAgent)) {
    await logViolation(ip, userAgent, `Bot detected (Score: ${botScore})`)
    req.isBot = true
    req.botReason.push(`High bot score (${botScore}) or suspicious User-Agent`)
    return next()
  }

  // Apply rate limiting based on botScore
  if (botScore >= 30) {
    req.isBot = true
    req.botReason.push(`Suspicious bot score (${botScore})`)
    return next()
  }

  return next() // Proceed for normal users
}

const logViolation = async (ip: string, userAgent: string, reason: string): Promise<void> => {
  logger.warn(`Violation detected: IP=${ip}, UserAgent=${userAgent}, Reason=${reason}`)
}

export const isBotUA = (userAgent: string | undefined): boolean => {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /facebookexternalhit/i,
    /facebot/i,
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /yandex/i,
    /baidu/i,
    /duckduckgo/i,
    /semrush/i,
    /lighthouse/i,
    /headless/i,
    /scraper/i,
    /phantom/i,
    /selenium/i,
    /webdriver/i,
    /puppeteer/i,
    /playwright/i,
    /cypress/i,
    /wget/i,
    /curl/i,
    /python-requests/i,
    /java/i,
    /go-http/i,
    /http-client/i,
    /perl/i,
    /ruby/i
  ]

  // Check for missing browser characteristics
  const missingBrowserCharacteristics =
    !userAgent ||
    userAgent.length < 20 ||
    !userAgent.includes('Mozilla') ||
    userAgent.includes('PhantomJS') ||
    userAgent.includes('HeadlessChrome') ||
    userAgent.includes('Electron') ||
    /node\.js/i.test(userAgent)

  // Check if the User-Agent matches any bot patterns
  const matchesPattern = botPatterns.some((pattern) => pattern.test(userAgent || ''))

  return matchesPattern || missingBrowserCharacteristics
}

export const getClientIps = (req: Request): string => {
  const forwardedIpsHeader = req.headers['x-forwarded-for'] as string | undefined
  if (forwardedIpsHeader) {
    const ips = forwardedIpsHeader.split(',')
    return ips[0].trim()
  }

  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'] as string
  }

  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'] as string
  }

  return req.ip || 'unknown'
}
