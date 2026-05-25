import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator'

export class UpdateModelsInfoDTO {
  @IsString()
  @IsNotEmpty()
  default: string

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  challengers: Array<string>
}

export class AddModelsInfoDTO {
  @IsNotEmpty()
  @IsString()
  model_name: string

  @IsNotEmpty()
  @IsBoolean()
  is_default: boolean
}
