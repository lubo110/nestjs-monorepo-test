import { Transform } from 'class-transformer'
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, Min } from 'class-validator'
import { BeatResult } from '../ecg_analysis_result/interfaces'
import { AgeRange, DoctorDiagnosisStatus } from './doctor_diagnosis.enum'
import { EcgAnalysisSummary } from './types'

export class SubmitDoctorReportDTO {
  @IsString()
  @IsNotEmpty()
  conclusion: string

  @IsNotEmpty()
  @IsString()
  recommendation: string

  @IsObject()
  ecg_analysis_summary: EcgAnalysisSummary

  @IsOptional()
  @IsArray()
  beat_results_override?: BeatResult[]
}
export class SaveDoctorReportDraftDTO {
  @IsOptional()
  @IsString()
  conclusion?: string

  @IsOptional()
  @IsString()
  recommendation?: string

  @IsOptional()
  @IsObject()
  ecg_analysis_summary?: EcgAnalysisSummary

  @IsOptional()
  @IsArray()
  beat_results_override?: BeatResult[]
}

/**
 * 分页查询参数 DTO
 */
export class DoctorDiagnosisListQueryDTO {
  @IsOptional()
  @IsEnum(DoctorDiagnosisStatus)
  status?: DoctorDiagnosisStatus // 诊断状态

  @IsOptional()
  @IsString()
  user_name?: string

  @IsOptional()
  @IsString()
  doctor_name?: string

  @IsOptional()
  @IsEnum(['male', 'female', 'all'])
  @Transform(({ value }) => {
    if (value === 0 || value === '0')
      return 'male'
    if (value === 1 || value === '1')
      return 'female'
    return value
  })
  gender?: 'male' | 'female' | 'all'

  @IsOptional()
  @IsEnum(AgeRange)
  age_range?: AgeRange

  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(400)
  page_size = 20
}
