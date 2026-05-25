import { IsEnum, IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator'
import { SmsType } from '@incare/modules/shared/enums/sms_type.enum'

export class SignupDTO {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  readonly phone: string

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 20, { message: '密码长度需在6~20位之间' })
  readonly password: string

  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  readonly code: string

  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  readonly username: string

  @IsString()
  @IsNotEmpty({ message: '签名不能为空' })
  readonly signature: string

  @IsString()
  @IsNotEmpty({ message: '邀请码不能为空' })
  readonly invite_code: string
}

export class ResetPasswordDTO {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  readonly phone: string

  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  readonly newPassword: string

  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  readonly code: string
}
export class ChangePasswordDTO {
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '新密码长度不能少于 6 位' })
  readonly newPassword: string

  @IsString()
  @IsNotEmpty({ message: '当前密码不能为空' })

  readonly oldPassword: string
}
export class SendSmsCodeDTO {
  @IsNotEmpty({ message: '短信类型不能为空' })
  @IsEnum(SmsType, { message: '短信类型必须是有效的类型' })
  sms_type: SmsType
}

export class GenerateInviteDTO {
  @IsString()
  @IsNotEmpty({ message: '注册链接不能为空' })
  readonly invite_url: string
}
