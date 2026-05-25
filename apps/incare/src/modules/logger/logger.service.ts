import * as path from 'node:path'
import { Injectable, Scope } from '@nestjs/common'
import * as winston from 'winston'
import { DailyRotateFile } from 'winston/lib/winston/transports'
import { isObject } from '../shared/utils/data-type'
import 'winston-daily-rotate-file'

type ObjectType = Record<string, any>

function transportsHandler(handlerName?: string) {
  const transportsList: winston.transport[] = [
    // 只有 error 等級的錯誤 , 才會將訊息寫到 error.log 檔案中
    new DailyRotateFile({
      // filename: 'logs/error-%DATE%.log', ex: logs/error-2022-01-27-04.log
      filename: path.join('logs', `error-v2-%DATE%.log`),
      // 按天存放
      datePattern: 'YYYY-MM-DD',
      // 自動壓縮
      zippedArchive: true,
      handleExceptions: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    new DailyRotateFile({
      // info or 以上的等級的訊息 , 將訊息寫入 info.log 檔案中
      filename: path.join('logs', `info-v2-%DATE%.log`),
      // 按天存放
      datePattern: 'YYYY-MM-DD',
      // 自動壓縮
      zippedArchive: true,
      handleExceptions: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
    }),
  ]

  if (process.env.NODE_ENV !== 'production') {
    transportsList.push(
      new winston.transports.Console({
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
          winston.format.prettyPrint({ colorize: true }),
          winston.format.errors({ stack: true }),
          winston.format.printf(
            info =>
              ` ${info.label}  ${info.timestamp}  ${info.level}  ${handlerName}: ${info.message}`,
          ),
        ),
      }),
    )
  }
  return transportsList
}

@Injectable({
  scope: Scope.TRANSIENT,
})
export class LoggerService {
  private logger: winston.Logger
  constructor(handlerName = '') {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV !== 'production' ? 'silly' : 'info',
      format: winston.format.combine(
        // 設定info中會有timestamp屬性
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        // info.level在控制台中輸出會有顏色
        // winston.format.colorize(),
        // winston.format.errors({ stack: true }),
        winston.format.json(),
        // 自定義輸出代碼格式

        winston.format.printf(({ prefix, ...info }) => {
          return `[${info.timestamp}] [${info.level}]【${handlerName}】${
            prefix ? `-[${prefix}]` : ''
          } ${info.message}`
        }),
      ),
      transports: transportsHandler(handlerName),
    })
  }

  // log level 0
  public error(message: string | ObjectType, prefix = ''): void {
    this.logger.error(this.toString(message), { prefix })
  }

  // log level 1
  public warn(message: string | ObjectType, prefix = ''): void {
    this.logger.warn(this.toString(message), { prefix })
  }

  // log level 2
  public info(message: string | ObjectType, prefix = ''): void {
    this.logger.info(this.toString(message), { prefix })
  }

  // log level 3
  public http(message: string | ObjectType, prefix = ''): void {
    this.logger.http(this.toString(message), { prefix })
  }

  // log level 4
  public verbose(message: string | ObjectType, prefix = ''): void {
    this.logger.verbose(this.toString(message), { prefix })
  }

  // log level 5
  public debug(message: string | ObjectType, prefix = ''): void {
    this.logger.debug(this.toString(message), { prefix })
  }

  // log level 6
  public silly(message: string | ObjectType, prefix = ''): void {
    this.logger.silly(this.toString(message), { prefix })
  }

  private toString(message: string | ObjectType): string {
    if (isObject(message)) {
      return JSON.stringify(message, null, 2)
    }
    else {
      return message as string
    }
  }
}
