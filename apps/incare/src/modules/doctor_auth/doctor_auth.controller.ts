import { RolesGuard } from '@incare/modules/guards/roles.guard'
import { CurrentUser } from '@incare/modules/shared/decorators/current_user.decorator'
import { Permissions } from '@incare/modules/shared/decorators/permission.decorator'
import { Public } from '@incare/modules/shared/decorators/public.decorator'
import { SkipAppGuard } from '@incare/modules/shared/decorators/skip_app_guard.decorator'
import { Platform } from '@incare/modules/shared/enums/common.enum'
import { LoggerInterceptor } from '@incare/modules/shared/interceptors/logger.interceptor'
import { ResponseInterceptor } from '@incare/modules/shared/interceptors/response.interceptor'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { CaptchaService } from './captcha.service'
import { ChangePasswordDTO, GenerateInviteDTO, SendSmsCodeDTO, SignupDTO } from './doctor_auth.dto'
import { JwtPayloadWithDoctor, SendSmsCode } from './doctor_auth.interface'
import { DoctorAuthService } from './doctor_auth.service'
import { DoctorJwtAuthGuard } from './guards/doctor_jwt.auth.guard'
import { DoctorLocalAuthGuard } from './guards/doctor_local.auth.guard'
import { InviteCodeService } from './invite_code.service'

@UseInterceptors(ResponseInterceptor)
@SkipAppGuard()
@UseGuards(DoctorJwtAuthGuard)
@Controller('doctor/auth/')
export class DoctorAuthController {
  constructor(
    private readonly authService: DoctorAuthService,
    private readonly captchaService: CaptchaService,
    private readonly inviteCodeService: InviteCodeService,
  ) { }

  @UseInterceptors(LoggerInterceptor)
  @Public()
  @Post('/signup')
  async handleSignUp(@Body(new ValidationPipe()) body: SignupDTO) {
    const valid = await this.inviteCodeService.useInviteCode(body.invite_code)

    if (!valid) {
      throw new BadRequestException('邀请码无效或已过期')
    }
    return this.authService.signup(body)
  }

  @Public()
  @UseInterceptors(LoggerInterceptor)
  @Post('/send-sms/:phone')
  sendSmsCode(@Param() params: SendSmsCode, @Body(new ValidationPipe()) body: SendSmsCodeDTO) {
    return this.authService.sendSmsCode(params.phone, body)
  }

  @Public()
  @Get('/captcha')
  async getCaptcha() {
    return this.captchaService.generate()
  }

  /**
   * Login user (mobile and web) after authentication
   */
  @Public()
  @UseGuards(DoctorLocalAuthGuard)
  @Post('/login')
  async handleLogin(
    @Req() req,
    @Headers(Platform.HEADER_KEY) platform: Platform = Platform.WEB,
    @Headers('user-agent') ua: string,
  ) {
    return this.authService.login(req.user, platform, ua)
  }

  @Post('/logout')
  async logout(@CurrentUser() user: JwtPayloadWithDoctor) {
    return this.authService.handleUserLogout(user)
  }

  /**
   * Resend verification code to the phone number
   */
  // @Public()
  // @UseInterceptors(LoggerInterceptor)
  // @Post('/password/reset')
  // resetPassword(@Req() req, @Body() body: ResetPasswordDTO) {
  //   return this.authService.changePassword(
  //     body.phone,
  //     body.code,
  //     body.newPassword,
  //   )
  // }

  @UseInterceptors(LoggerInterceptor)
  @Post('/password/change')
  changePassword(@CurrentUser() doctor: JwtPayloadWithDoctor, @Body() body: ChangePasswordDTO) {
    return this.authService.changePassword(
      doctor,
      body,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Post('/signup-invite')
  async generateSignupInviteUrl(
    @Body() body: GenerateInviteDTO,
  ) {
    const code = await this.inviteCodeService.createInviteCode()
    return `${body.invite_url}?code=${code}`
  }
}
