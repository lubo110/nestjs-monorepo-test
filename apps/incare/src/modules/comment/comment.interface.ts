import { DiagnosisDocument } from '../diagnosis/diagnosis.schemas'
import { Platform } from '../shared/enums/common.enum'

export interface IPredictionMessage {
  user_id: string
  third_party_id?: string
  diagnosis_id: string
  measure_time: string
  platform: Platform
  default_model: string
  lang?: string
  push_type?: string
  phone: string
}

export interface IPredictionRequest {
  diagnosis: DiagnosisDocument
  platform: Platform
  default_model: string
  req_id: string
  third_party_id?: string
  lang: string
  push_type?: string
  phone: string
}

export interface DiagnosisWithDoctorDiagnosis extends DiagnosisDocument {
  doctorDiagnosis?: {
    report_pdf_key: string
  }
}
