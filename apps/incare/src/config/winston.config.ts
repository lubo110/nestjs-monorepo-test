import * as path from 'node:path'
import { utilities as nestWinstonModuleUtilities } from 'nest-winston'
import winston = require('winston')
import DailyRotateFile = require('winston-daily-rotate-file')

const context = process.env.HOSTNAME || 'v2-default'
const isProd = process.env.NODE_ENV === 'production'
export default () => {
  const transports: any[] = []

  // 只有 error 等級的錯誤 , 才會將訊息寫到 error.log 檔案中
  transports.push(
    new DailyRotateFile({
      // filename: 'logs/error-%DATE%.log', ex: logs/error-2022-01-27-04.log
      filename: path.join('logs', `error-${context}-%DATE%.log`),
      // 按天存放
      datePattern: 'YYYY-MM-DD',
      // 自動壓縮
      zippedArchive: true,
      handleExceptions: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
  )

  transports.push(
    new DailyRotateFile({
      // info or 以上的等級的訊息 , 將訊息寫入 info.log 檔案中
      filename: path.join('logs', `info-${context}-%DATE%.log`),
      // 按天存放
      datePattern: 'YYYY-MM-DD',
      // 自動壓縮
      zippedArchive: true,
      handleExceptions: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
    }),
  )

  // if (process.env.NODE_ENV != "production") {
  transports.push(
    new winston.transports.Console({
      level: isProd ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.colorize({
          all: true,
        }),
        winston.format.label({
          label: '[LOGGER]',
        }),
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.errors({ stack: true }),
      ),
    }),
  )
  // }

  return {
    exitOnError: false,
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY/MM/DD HH:mm:ss.SSS',
      }),
      winston.format.ms(),
      winston.format.prettyPrint(),
      winston.format.errors({ stack: true }),
      nestWinstonModuleUtilities.format.nestLike(),
    ),
    transports,
  }
}
