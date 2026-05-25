import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'
import { IsNumberStringOrEmpty } from '../shared/decorators/is_number_string_or_empty.decorator'
import { Language } from '../shared/enums/common.enum'

export class UserUpdateDTO {
  @IsString()
  readonly phone: string

  @IsOptional()
  @IsString()
  readonly email: string

  @IsOptional()
  @IsString()
  readonly gender: string

  @IsOptional()
  @IsString()
  readonly birthday: string

  @IsOptional()
  @IsString()
  readonly username: string

  @IsEnum(Language)
  @IsOptional()
  readonly language: string

  @IsNumberStringOrEmpty({
    message: 'Height must be a numeric string.',
  })
  @IsOptional()
  readonly height: string

  @IsNumberStringOrEmpty({
    message: 'Weight must be a numeric string.',
  })
  @IsOptional()
  readonly weight: string

  @IsString()
  @IsOptional()
  readonly country: string
}

export class SignupDTO {
  @IsString()
  readonly phone: string

  @IsString()
  readonly password: string

  @IsEnum(Language)
  @IsOptional()
  readonly language: string
}

export class UpdatePasswordDTO {
  @IsString()
  @IsNotEmpty({ message: 'Current password cannot be empty' })
  readonly current_password: string

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  readonly new_password: string
}

export class UpdateAiTrainingAgreementDTO {
  @IsString()
  @IsNotEmpty({ message: 'Current user id cannot be empty' })
  readonly user_id: string

  @IsNumber()
  readonly dev_plan: number
}
