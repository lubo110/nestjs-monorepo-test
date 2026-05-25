import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import maskData = require('maskdata')
import { ClsService } from 'nestjs-cls'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  logger = new Logger(LoggerMiddleware.name)
  constructor(private readonly cls: ClsService) {}
  use(req: Request & { user: any }, res: Response, next: NextFunction) {
    const method = req.method
    const url = req.url
    const body = req.body
    const params = req.params
    const query = req.query
    const user = req.user
    // add trace id
    req.header['x-request-id'] = uuidv4()
    const req_id = req.header['x-request-id']
    // store x-request-id to the cls context.
    this.cls.set('req_id', req_id)

    const jsonMaskConfig = {
      passwordFields: ['password', 'new_password', 'current_password'],
    }

    const message = {
      user,
      params: maskData.maskJSON2(params, jsonMaskConfig),
      query,
      body: maskData.maskJSON2(this.safeSummarizeBody(body), jsonMaskConfig),
    }
    const requestInfo = `[req_id:${req_id}] [${method}] [${url}]【Request】: ${JSON.stringify(
      message,
    )}`
    this.logger.log(requestInfo)

    next()
  }

  safeSummarizeBody(body: any) {
    if (!body)
      return body
    //  Object
    if (typeof body === 'object') {
      const result: Record<string, any> = {}

      for (const key of Object.keys(body)) {
        const value = body[key]

        if (Buffer.isBuffer(value)) {
          result[key] = `<Buffer ${value.length} bytes>`
        }
        else if (Array.isArray(value)) {
          result[key] = `<Array length=${value.length}>`
        }
        else if (typeof value === 'object' && value !== null) {
          result[key] = `<Object keys=${Object.keys(value).length}>`
        }
        else {
          result[key] = value
        }
      }

      return result
    }
    return body
  }
}
