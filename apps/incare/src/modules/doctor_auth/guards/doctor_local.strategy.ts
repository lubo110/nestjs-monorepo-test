import type { Request } from 'express'
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { DoctorAuthService } from '../../doctor_auth/doctor_auth.service'

@Injectable()
export class DoctorLocalStrategy extends PassportStrategy(Strategy, 'doctor-local') {
  constructor(private readonly authService: DoctorAuthService) {
    super({
      passReqToCallback: true,
      usernameField: 'identifier',
      passwordField: 'password',
    })
  }

  async validate(
    request: Request,
    identifier: string,
    password: string,
  ): Promise<any> {
    const { captcha, captchaId } = request.body
    return await this.authService.authenticateUser(
      identifier,
      password,
      captcha,
      captchaId,
    )
  }
}
