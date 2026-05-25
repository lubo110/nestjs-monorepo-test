import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { Language } from '../shared/enums/common.enum'

export class CreateConfigurationDTO {
  @IsNotEmpty()
  @IsString()
  key: string

  @IsString()
  category: string

  @IsNotEmpty()
  value: any

  @IsString()
  type: string

  @IsString()
  description: string
}
export class UpdateConfigurationDTO {
  @IsString()
  key: string

  @IsNotEmpty()
  value: any

  category?: string

  type?: string

  description?: string
}

export class CreateCategoryParamsDTO {
  @IsString()
  category_name: string

  @IsEnum(Language)
  @IsString()
  lang: string
}

export class EditCategoryParamsDTO {
  @IsEnum(Language)
  @IsString()
  lang: string

  @IsString()
  category_id: string

  @IsString()
  category_name: string
}
export class RemoveCategoryParamsDTO {
  @IsEnum(Language)
  @IsString()
  lang: string

  @IsString()
  category_id: string
}
