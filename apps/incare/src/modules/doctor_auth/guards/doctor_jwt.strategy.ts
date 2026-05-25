import { authConfig, AuthConfig } from '@incare/config/index'
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { DoctorAuthService } from '../../doctor_auth/doctor_auth.service'

@Injectable()
export class DoctorJwtStrategy extends PassportStrategy(Strategy, 'doctor-jwt') {
  constructor(
    private readonly authService: DoctorAuthService,
    @Inject(authConfig.KEY)
    readonly config: AuthConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.secretDoctor,
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: any) {
    const isValid = await this.authService.validateUserJWT(
      payload.sub,
      payload.jti,
    )

    if (!isValid)
      throw new UnauthorizedException('登录已过期，请重新登录。')

    return {
      id: payload.sub,
      phone: payload.phone,
      role: payload.role,
      jti: payload.jti,
      user_name: payload.user_name,
    }
  }
}
