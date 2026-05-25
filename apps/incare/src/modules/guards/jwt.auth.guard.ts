import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { SKIP_APP_GUARD } from '@incare/modules/shared/decorators/skip_app_guard.decorator'
import { IS_PUBLIC_KEY } from '../shared/decorators/public.decorator'
import { IS_THIRD_PARTY_KEY } from '../shared/decorators/third_party.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const is_public = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (is_public)
      return true

    const is_skip_app_guard = this.reflector.getAllAndOverride<boolean>(SKIP_APP_GUARD, [
      context.getHandler(),
      context.getClass(),
    ])
    if (is_skip_app_guard)
      return true

    const is_third_party = this.reflector.getAllAndOverride<boolean>(
      IS_THIRD_PARTY_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (is_public || is_third_party) {
      return true
    }
    return super.canActivate(context)
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      console.log('JwtAuthGuard handleRequest error', {
        err,
        user,
        info,
      })
      throw err || new UnauthorizedException('Invalid JWT token')
    }
    return user
  }
}
