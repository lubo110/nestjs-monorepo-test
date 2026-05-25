import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { authConfig, AuthConfig } from '@incare/config/index'
import { AuthService } from '../auth/auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    @Inject(authConfig.KEY)
    readonly config: AuthConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.secretUserV2,
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: any) {
    const isValid: boolean = await this.authService.validateUserJWT(
      payload.sub,
      payload.jti,
    )

    if (!isValid)
      throw new UnauthorizedException('Invalid access token')

    let country = 'CN'
    if (payload.phone) {
      const phoneNumber = parsePhoneNumberFromString(payload.phone)
      country = phoneNumber?.country
    }

    return {
      id: payload.sub,
      phone: payload.phone,
      role: payload.role,
      jti: payload.jti,
      third_party_id: payload.third_party_id ? payload.third_party_id : null,
      external_user_id: payload.external_user_id ? payload.external_user_id : null,
      isMainlandChinaUser: country === 'CN',
    }
  }
}
