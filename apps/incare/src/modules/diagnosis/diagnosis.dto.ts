import { Transform, Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator'
import { OrderByType } from '../shared/enums/common.enum'
import { DiagnosisType } from '../shared/enums/diagnosis.enum'
import { IsStartNumberLessThanOrEqualToEndNumber } from '../shared/validators/is-start-number-less-than-or-equal-to-end-number.validator'

export class QueryDiagnosisDTOV2 {
  @IsString()
  readonly medical_id: string

  @IsOptional()
  @IsString()
  diagnosis_id: string

  @IsNumber()
  start_number: number

  @IsNumber()
  @Validate(IsStartNumberLessThanOrEqualToEndNumber)
  end_number: number

  @IsOptional()
  @IsString()
  readonly tag_value: string

  @IsOptional()
  @IsString()
  search_phone: string

  @IsOptional()
  @IsString()
  medical_record_number: string

  @IsBoolean()
  enabled: boolean
}

export class CreateDiagnosisDTOV2 {
  @IsString()
  readonly medical_id: string

  @IsEnum(DiagnosisType)
  readonly type: DiagnosisType

  @IsString()
  readonly device_id: string

  @IsString()
  readonly firmware_version: string

  @IsString()
  readonly mac_address: string

  @IsString()
  readonly gain: string

  @IsString()
  readonly latitude: string

  @IsString()
  readonly longitude: string

  @IsString()
  readonly measure_times: string

  @IsString()
  readonly measure_type: string

  @IsString()
  readonly user_id: string

  @IsOptional()
  readonly create_date: Date

  @IsOptional()
  readonly start_time: Date

  @IsOptional()
  readonly end_time: Date

  @IsOptional()
  @IsString()
  readonly name: string

  @IsOptional()
  @IsNumber()
  readonly age: number

  @IsOptional()
  @IsString()
  readonly gender: string

  @IsOptional()
  @IsString()
  readonly phone: string

  @IsOptional()
  @IsString()
  readonly medical_record_number: string
}

export class QueryDiagnosisCalDTO {
  @IsString()
  readonly user_id: string

  readonly start_date: Date

  readonly end_date: Date

  @IsOptional()
  @IsString()
  readonly medical_record_number: string

  @IsEnum(OrderByType)
  readonly order_by: OrderByType
}

export class QueryDisableDiagnosisDTO {
  readonly user_id: string

  readonly phone: string

  readonly start_number: number

  readonly end_number: number

  readonly search_uid: string

  readonly search_phone: string
}

export class QueryDiagnosisRangeDTOV2 {
  @IsString()
  readonly medical_id: string

  @IsString()
  readonly role: string

  @Type(() => Date)
  @IsDate()
  readonly start: Date

  @Type(() => Date)
  @IsDate()
  readonly end: Date
}

export class UpdateSyntheticParams {
  @IsString()
  readonly diagnosis_id: string

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
  // readonly value: string;
  readonly value
}

export class QueryAllChannelDiagnosis {
  @IsUUID()
  @IsString()
  readonly diagnosis_id: string

  @IsBoolean()
  readonly all_channels: boolean
}

export class DeviceIdsDiagnosesQueryDTO {
  @IsOptional()
  @IsString()
  readonly user_id: string

  @IsArray({ message: 'device_Ids must be an array.' })
  @ArrayNotEmpty({ message: 'device_ids should not be empty.' })
  @ArrayUnique({ message: 'device_ids must be unique.' })
  @IsString({ each: true, message: 'Each device_id must be a string.' })
  device_ids: string[]

  @IsNumber()
  start_number: number

  @IsNumber()
  @Validate(IsStartNumberLessThanOrEqualToEndNumber)
  end_number: number
}

export class CountByDeviceIdsDTO {
  @IsOptional()
  @IsString()
  readonly user_id: string

  @IsArray({ message: 'device_Ids must be an array.' })
  @ArrayNotEmpty({ message: 'device_ids should not be empty.' })
  @ArrayUnique({ message: 'device_ids must be unique.' })
  @IsString({ each: true, message: 'Each device_id must be a string.' })
  device_ids: string[]
}
