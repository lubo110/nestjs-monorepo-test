import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { RolesGuard } from '../guards/roles.guard'
import { Permissions } from '../shared/decorators/permission.decorator'
import { LoginInfoService } from './login_info.service'

@Permissions('admin')
@UseGuards(RolesGuard)
@Controller()
export class LoginInfoController {
  constructor(private readonly loginInfoService: LoginInfoService) {}

  @Get('/login-info/all')
  async getAllUserLoginInfo(@Req() req) {
    return this.loginInfoService.getAllUserLoginInfo(req.user)
  }
}
