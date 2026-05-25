import { Type } from 'class-transformer'
import { IsDate, IsOptional, IsString } from 'class-validator'

export class CreateThirdPartyDTO {
  @IsString()
  readonly third_party_name: string

  @IsString()
  @IsOptional()
  readonly i8_device_name_prefix: string
}

export class UpdateThirdPartyDTO {
  @IsOptional()
  @IsString()
  readonly third_party_id: string

  @IsString()
  readonly third_party_name: string

  @IsOptional()
  readonly is_active: boolean

  @Type(() => Date)
  @IsDate()
  readonly expiry_date: Date
}

export class AiEvaluationDTO {
  @IsString()
  readonly diagnosis_id: string

  @IsString()
  readonly notify_url: string
}
