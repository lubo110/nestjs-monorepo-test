import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { Language, OrderByType } from '../shared/enums/common.enum'
import { IsBiggerThan } from '../shared/validators/is-bigger-than'

export class CreatePostDTO {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  category: string

  @IsString()
  content: string

  @IsEnum(Language)
  lang: string

  @IsMongoId()
  @IsString()
  cover_image: string

  @IsArray()
  @IsMongoId({ each: true })
  attachments: Array<string>

  @IsOptional()
  hash_tag: Array<string>

  @IsString()
  create_user: string
}

export class UpdatePostDTO {
  @IsMongoId()
  @IsString()
  post_id: string

  @IsOptional()
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  category: string

  @IsOptional()
  @IsString()
  content: string

  @IsOptional()
  @IsString()
  lang: string

  @IsOptional()
  @IsMongoId()
  @IsString()
  cover_image: string

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  attachments: Array<string>

  @IsOptional()
  hash_tag: Array<string>

  @IsOptional()
  @IsBoolean()
  enabled: boolean

  @IsOptional()
  @IsString()
  create_user: string

  @IsString()
  user_id: string
}

export class QueryListPostDTO {
  @IsString()
  user_id: string

  @Min(1)
  @IsNumber()
  start_num: number

  @Min(1)
  @IsBiggerThan('start_num', {
    message: 'end_num must be larger than start_num',
  })
  @IsNumber()
  end_num: number

  @IsEnum(OrderByType)
  order_by: OrderByType

  @IsBoolean()
  published_flag: boolean

  @IsBoolean()
  enable: boolean

  @IsOptional()
  @Transform(({ value }) => {
    if (Object.values(Language).includes(value))
      return value
    return Language.EN_US
  })
  lang: string
}

export class PublishPostDTO {
  @IsMongoId()
  @IsString()
  post_id: string

  @IsString()
  user_id: string

  @IsOptional()
  @IsBoolean()
  published_flag: boolean

  @Type(() => Date)
  @IsDate()
  published_time: Date
}

export class QueryPostParamsDTO {
  @IsMongoId()
  @IsString()
  post_id: string

  @IsString()
  user_id: string

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true')
        return true
      if (value.toLowerCase() === 'false')
        return false
    }
    return value
  })
  @IsBoolean()
  @IsOptional()
  enable: boolean
}

export class DeletePostParamsDTO {
  @IsMongoId()
  @IsString()
  post_id: string

  @IsString()
  user_id: string
}
