import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { LocalAuthGuard } from '../guards/local.auth.guard'
import { Public } from '../shared/decorators/public.decorator'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import { TransformDateFieldsPipe } from '../shared/pipes/transform-date-fields.pipe'
import { SignupDTO, UpdateAiTrainingAgreementDTO, UpdatePasswordDTO, UserUpdateDTO } from './user.dto'
import { UserService } from './user.service'

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Sign up a new mobile user
   */
  @UseInterceptors(LoggerInterceptor)
  @Public()
  @Post('/signup')
  async handleSignUp(@Body(new ValidationPipe()) body: SignupDTO) {
    return this.userService.signup(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @UsePipes(new TransformDateFieldsPipe(['birthday'])) // 指定需要轉換的日期欄位
  @Public()
  @Put('/user/complete')
  handleUpdateUser(@Body(new ValidationPipe()) body: UserUpdateDTO) {
    return this.userService.updateUser(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Public()
  @Post('/check/:phone')
  handlePhoneExist(@Param() params) {
    return this.userService.phone_exist(params.phone)
  }

  /**
   * Move user account to unregister
   */
  @UseInterceptors(LoggerInterceptor)
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/user/deregister')
  async deregisterUser(@Req() req) {
    return this.userService.deregisterUser(req.user.phone)
  }

  @UseInterceptors(LoggerInterceptor)
  @Get('/user/id/:phone')
  async getUserIdByPhone(@Param('phone') phone: string) {
    return this.userService.findUserIdByPhone(phone)
  }

  @Patch('/user/:phone/password/change')
  async updatePassword(
    @Param('phone') phone: string,
    @Body() body: UpdatePasswordDTO,
  ) {
    return await this.userService.updatePassword(
      phone,
      body.current_password,
      body.new_password,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Patch('/user/ai-training-agreement')
  /**
   * 更新用户AI训练协议的方法
   * @param body 包含更新AI训练协议信息的DTO对象
   * @returns 返回userService中updateUserAiTrainingAgreement方法的执行结果
   */
  async updateUserAiTrainingAgreement(@Body() body: UpdateAiTrainingAgreementDTO) {
    return this.userService.updateUserAiTrainingAgreement(body)
  }
}
