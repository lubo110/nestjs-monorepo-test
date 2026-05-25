import { CurrentUser } from '@incare/modules/shared/decorators/current_user.decorator'
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseInterceptors,
} from '@nestjs/common'
import { JwtPayloadWithDoctor } from '../doctor_auth/doctor_auth.interface'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import { UpdatePasswordDTO } from './doctor_user.dto'
import { DoctorUserService } from './doctor_user.service'

@Controller('doctor')
export class DoctorUserController {
  constructor(private readonly userService: DoctorUserService) {}

  @UseInterceptors(LoggerInterceptor)
  @Get('/user/id/:phone')
  async getUserIdByPhone(@Param('phone') phone: string) {
    return this.userService.findByPhone(phone)
  }

  @Patch('/user/password/change')
  async updatePassword(
    @CurrentUser() doctor: JwtPayloadWithDoctor,
    @Body() body: UpdatePasswordDTO,
  ) {
    return await this.userService.changePassword(
      doctor.phone,
      body.current_password,
      body.new_password,
    )
  }
}
