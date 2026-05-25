import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator'
import { FileType, OrderByType } from '../shared/enums/common.enum'

export class FileRemoveDTO {
  @IsString()
  @IsNotEmpty()
  user_id: string

  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true })
  file_ids: Array<string>
}

export class QueryListFileDTO {
  @IsString()
  @IsNotEmpty()
  user_id: string

  @IsNumber()
  start_num: number

  @IsNumber()
  end_num: number

  @IsEnum(FileType)
  file_type: FileType = FileType.IMG

  @IsEnum(OrderByType)
  order_by: OrderByType = OrderByType.DESC
}

export class QueryFileParamsDTO {
  @IsMongoId()
  @IsString()
  file_id: string

  @IsString()
  @IsNotEmpty()
  user_id: string
}
