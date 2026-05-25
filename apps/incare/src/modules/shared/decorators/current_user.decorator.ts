import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../../auth/auth.interface'

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user: JwtPayload }>()
    return data ? req.user[data] : req.user
  },
)
