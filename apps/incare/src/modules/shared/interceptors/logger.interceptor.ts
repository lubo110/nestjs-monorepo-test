import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name)
  private readonly MAX_LOG_SIZE = 30 * 1024 // 50KB

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    const res = context.switchToHttp().getResponse()
    const method = req.method
    const url = req.url
    const reqId = req.header['x-request-id'] || 'unknown'
    const startTime = Date.now()

    // SSE 请求直接跳过
    const contentType = res.getHeader('content-type')?.toString() || ''
    if (contentType.startsWith('text/event-stream')) {
      return next.handle()
    }

    return next.handle().pipe(
      tap((data) => {
        const logMessage = this.buildLogMessage(data, method, url, reqId, startTime)
        if (logMessage === '') {
          return
        }
        this.logger.log(logMessage)
      }),
    )
  }

  /** 构建日志字符串 */
  private buildLogMessage(
    data: any,
    method: string,
    url: string,
    reqId: string,
    startTime: number,
  ) {
    let responseLog: string

    try {
      if (data === null || data === undefined) {
        responseLog = '【Response】: [Empty]'
      }
      else {
        const dataStr = JSON.stringify(data)
        const dataSize = Buffer.byteLength(dataStr, 'utf8')
        if (dataSize > this.MAX_LOG_SIZE) {
          const responseCode = this.extractResponseCode(data)
          responseLog = `【Response】: [Code: ${responseCode}] [Data too large: ${this.formatSize(dataSize)}]`
        }
        else {
          responseLog = `【Response】: ${dataStr}`
        }
        return `[req_id:${reqId}] [${method}] [${url}] ${responseLog} [${Date.now() - startTime} ms]`
      }
    }
    catch (error: any) {
      responseLog = `【Response】: [Data serialization failed: ${error.message}]`
      this.logger.error(
        `[req_id:${reqId}] [${method}] [${url}] ${responseLog} [${Date.now() - startTime} ms]`,
        error,
      )
    }
  }

  /** 提取 response.code */
  private extractResponseCode(responseData: any): string | number {
    return responseData?.code ?? 'unknown'
  }

  /** 格式化字节大小 */
  private formatSize(bytes: number, decimalPlaces: number = 2): string {
    if (!Number.isFinite(bytes) || bytes < 0)
      return '0 B'

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const BASE = 1024
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(BASE)), units.length - 1)
    const value = bytes === 0 ? 0 : bytes / BASE ** exponent
    return `${Number.parseFloat(value.toFixed(decimalPlaces))} ${units[exponent]}`
  }
}
