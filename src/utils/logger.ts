import winston from 'winston'

export const logger = winston.createLogger({
  level: 'warn',
  format: winston.format.json(),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'violations.log' })]
})
