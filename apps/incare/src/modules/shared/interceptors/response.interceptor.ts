import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { map } from 'rxjs/operators'
import { SUCCESS_MESSAGE_KEY } from '../decorators/success_message.decorator'
import { WaffleRequestStatus } from '../enums/common.enum'
import { WaffleResponse } from '../interfaces/common.interface'

@Injectable()
export class ResponseInterceptor<T>
implements NestInterceptor<T, WaffleResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const res = context.switchToHttp().getResponse()

    // SSE 不做任何包装
    if (res.getHeader('content-type') === 'text/event-stream') {
      return next.handle()
    }

    const message
      = this.reflector.get<string>(
        SUCCESS_MESSAGE_KEY,
        context.getHandler(),
      )
      || this.reflector.get<string>(
        SUCCESS_MESSAGE_KEY,
        context.getClass(),
      )
      || '操作成功!'
    return next.handle().pipe(
      map((res) => {
        if (res && typeof res === 'object' && 'code' in res && 'data' in res) {
          return res as WaffleResponse<T>
        }
        return {
          code: WaffleRequestStatus.SUCCESS,
          data: res,
          message,
        } as WaffleResponse<T>
      }),
    )
  }
}
