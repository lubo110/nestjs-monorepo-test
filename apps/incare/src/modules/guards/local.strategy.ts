import type { Request } from 'express'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthService } from '../auth/auth.service'
import { Platform } from '../shared/enums/common.enum'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
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
    // ios 会传 deviceToken，用于apn推送
    const deviceToken = request.body?.deviceToken
    const user = await this.authService.validateUser(
      identifier,
      password,
      request.headers[Platform.HEADER_KEY] as string,
      deviceToken,
    )

    if (!user) {
      throw new UnauthorizedException('Invalid phone or password')
    }
    else {
      return user
    }
  }
}
