import { ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { IS_THIRD_PARTY_KEY } from '../shared/decorators/third_party.decorator'

@Injectable()
export class ApiKeyGuard extends AuthGuard('headerapikey') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const isThirdParty = this.reflector.getAllAndOverride<boolean>(
      IS_THIRD_PARTY_KEY,
      [context.getHandler(), context.getClass()],
    )

    // 如果不是 third-party 路由，就直接跳過這個 Guard
    if (!isThirdParty) {
      return true
    }

    // 否則執行原本 AuthGuard('headerapikey') 的驗證邏輯
    return super.canActivate(context)
  }
}
