import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator'
import { BLEvents, ECGValue } from './measure.schemas'
// import { IValue, BLEvents } from "./measure.interface";

export class CreateMeasureDTO {
  @IsOptional()
  @IsString()
  user_id: string

  @IsNumber()
  readonly measure_index: number

  @IsNumber()
  readonly measure_counts_by_second: number

  @IsNumber()
  readonly counts: number

  @IsOptional()
  @IsArray()
  peak_indexs: Array<number>

  @IsOptional()
  @IsArray()
  heart_rate: Array<number>

  @IsOptional()
  @IsArray()
  stress: Array<number>

  @IsOptional()
  @IsNumber()
  event_count: number

  @IsOptional()
  @IsArray()
  event_detect: Array<BLEvents>

  @IsArray()
  readonly values: Array<ECGValue>
}
