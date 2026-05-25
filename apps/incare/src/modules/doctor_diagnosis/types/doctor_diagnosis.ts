import { Platform } from '@incare/modules/shared/enums/common.enum'
import { DoctorDiagnosisStatus } from '../doctor_diagnosis.enum'
import { EcgAnalysisSummary } from './ecg_analysis_summary'

/**
 * 分页返回结果类型
 */
export interface PaginationResult<T> {
  diagnoses: T[]
  counts: number
}

// doctor-diagnosis.dto.ts
export interface DoctorDiagnosisWithDiagnosis {
  diagnosis_id: string
  user_id: string
  doctor_id: string
  doctor_name: string
  status: DoctorDiagnosisStatus
  user_name: string
  user_phone: string
  platform: Platform
  age: number
  gender: string
  accepted_time: Date
  completed_time: Date
  conclusion: string
  recommendation: string
  doctor_pdf_url: string
  ecg_analysis_summary: EcgAnalysisSummary
  created_time: Date
  updated_time: Date
  // ✅ virtual populate 的字段
  diagnosis: {
    start_time: string
  }
}
export interface PdfRenderData {
  id: string
  /** 报告基础信息 */
  report: {
    title: string
    createdTime: string
    completedTime: string
  }

  /** 患者信息（展示用快照） */
  patient: {
    id: string
    name: string
    gender: string
    age: number
    phone: string
  }

  /** 医生信息 */
  doctor: {
    name: string
    signature: string
  }

  /** 诊断结论 */
  diagnosis: {
    conclusion: string
    recommendation: string
    report: Record<string, any>
  }
}
