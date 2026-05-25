import { authConfig, AuthConfig } from '@incare/config/index'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { DoctorLoginInfoModule } from '../doctor_login_info/login_info.module'
import { DoctorUserModule } from '../doctor_users/doctor_user.module'
import { CaptchaService } from './captcha.service'
import { DoctorAuthController } from './doctor_auth.controller'
import { DoctorAuthService } from './doctor_auth.service'
import { DoctorJwtStrategy } from './guards/doctor_jwt.strategy'
import { DoctorLocalStrategy } from './guards/doctor_local.strategy'
import { InviteCodeService } from './invite_code.service'

@Module({
  imports: [
    DoctorUserModule,
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (config: AuthConfig) => {
        return {
          secret: config.jwt.secretDoctor,
          signOptions: {
            expiresIn: config.jwt.expiresIn || '90d',
          },
        }
      },
    }),
    DoctorLoginInfoModule,
  ],
  providers: [DoctorAuthService, CaptchaService, DoctorLocalStrategy, DoctorJwtStrategy, InviteCodeService],
  controllers: [DoctorAuthController],
  exports: [DoctorAuthService],
})
export class DoctorAuthModule {}
