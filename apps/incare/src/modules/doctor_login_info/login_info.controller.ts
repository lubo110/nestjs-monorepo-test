import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { RolesGuard } from '../guards/roles.guard'
import { Permissions } from '../shared/decorators/permission.decorator'
import { DoctorLoginInfoService } from './login_info.service'

@Permissions('admin')
@UseGuards(RolesGuard)
@Controller()
export class DoctorLoginInfoController {
  constructor(private readonly loginInfoService: DoctorLoginInfoService) {}

  @Get('/login-info/all')
  async getAllUserLoginInfo(@Req() req) {
    return this.loginInfoService.getAllUserLoginInfo(req.user)
  }
}
