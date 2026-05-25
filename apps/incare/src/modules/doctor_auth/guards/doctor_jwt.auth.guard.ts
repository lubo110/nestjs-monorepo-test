import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { IS_PUBLIC_KEY } from '@incare/modules/shared/decorators/public.decorator'

@Injectable()
export class DoctorJwtAuthGuard extends AuthGuard('doctor-jwt') {
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

    return super.canActivate(context)
  }

  handleRequest(err, user, _info) {
    if (err || !user) {
      throw err || new UnauthorizedException('登录已过期，请重新登录。')
    }
    return user
  }
}
