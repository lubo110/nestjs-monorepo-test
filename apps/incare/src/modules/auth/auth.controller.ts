import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { LocalAuthGuard } from '../guards/local.auth.guard'
import { Public } from '../shared/decorators/public.decorator'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import { AuthService } from './auth.service'

@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login user (mobile and web) after authentication
   */

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async handleLogin(@Req() req) {
    return this.authService.login(req.user, req.headers)
  }

  @Post('/logout')
  async logout(@Req() req, @Body('login_id') login_id?: string) {
    return this.authService.handleUserLogout(req.user, login_id)
  }

  /**
   * Verifies phone number for a new signed up user with SMS code
   */
  @Public()
  @UseInterceptors(LoggerInterceptor)
  @Post('/verify/:phone/:code')
  handleVerifyPhone(@Param() params) {
    return this.authService.verifyPhone(params.phone, params.code)
  }

  /**
   * Resend verification code to the phone number
   */
  @Public()
  @UseInterceptors(LoggerInterceptor)
  @Post('/reset/:phone/:code/:new_password')
  handleResetPassword(@Req() req, @Param() params) {
    return this.authService.reset_password(
      params.phone,
      params.code,
      params.new_password,
    )
  }

  @Public()
  @UseInterceptors(LoggerInterceptor)
  @Post('/user/password/validation')
  @UseGuards(LocalAuthGuard)
  async verifyUserPassword(@Req() req) {
    return this.authService.verifyPassword(req.user)
  }
}
