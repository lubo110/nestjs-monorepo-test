import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { WaffleRequestStatus } from '../enums/common.enum'
import { ApiException } from '../exceptions/api.exception'

type ResponseException = 'string' | { message: string }
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest()
    const response = ctx.getResponse()
    const timestamp = new Date().toISOString()
    const method = request.method
    const url = request.url
    const req_id = request.header['x-request-id']
    const status
      = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    console.error(exception)
    this.logger.error(
      `[req_id:${req_id}] [${method}] [${url}]【Error Response】${exception} `,
      exception,
      'AllExceptionsFilter',
    )

    if (exception instanceof ApiException) {
      response.status(status).json({
        code: exception.getErrorCode(),
        message: exception.getErrorMessage(),
        timestamp,
        path: request.url,
      })
    }
    else if (exception instanceof HttpException) {
      const responseMessage = exception.getResponse() as ResponseException
      const message = typeof responseMessage === 'string'
        ? responseMessage
        : responseMessage?.message ?? 'An unexpected error occurred'

      response.status(status).json({
        code: status,
        message,
        timestamp,
        path: request.url,
      })
    }
    else {
      response.status(status).json({
        code: WaffleRequestStatus.AUTH_ERROR,
        message: 'UNAUTHORIZED',
        timestamp,
        path: request.url,
      })
    }
  }
}
