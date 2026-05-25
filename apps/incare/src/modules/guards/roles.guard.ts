import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  PERMISSIONS_KEY,
} from '../shared/decorators/permission.decorator'

// 20220815加入角色守衛
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // 取得當前controller的權限設定
    const required_perms = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!required_perms)
      return true

    // 如果user角色包含當前controller權限設定，則通過
    const { user } = context.switchToHttp().getRequest()
    const user_roles: string[] = user?.role ?? []

    return required_perms.some(p => user_roles.includes(p))
  }
}
