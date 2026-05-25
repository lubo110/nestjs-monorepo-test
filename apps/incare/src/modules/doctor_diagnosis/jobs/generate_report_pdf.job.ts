import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bull'
import { JOB_NAMES, QUEUE_NAMES } from '@incare/modules/shared/strings'
import { formatDate } from '@incare/modules/shared/utils/util'
import { DoctorDiagnosisWithDiagnosis, PdfRenderData } from '../types/doctor_diagnosis'

@Injectable()
export class GenerateReportPdfJob {
  constructor(@InjectQueue(QUEUE_NAMES.DOCTOR_REPORT_PDF_GENERATE) private readonly pdfQueue: Queue) { }
  async dispatch(data: DoctorDiagnosisWithDiagnosis, signature: string = '') {
    const plainDiagnosis = this.toPdfRenderData(data, signature)
    await this.pdfQueue.add(JOB_NAMES.DOCTOR_REPORT_GENERATE_PDF, plainDiagnosis, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    })
  }

  private toPdfRenderData(doctorDiagnosis: DoctorDiagnosisWithDiagnosis, doctorSignature: string, reportTitle?: string): PdfRenderData {
    const genderMap: Record<string, string> = {
      male: '男',
      female: '女',
    }
    return {
      id: doctorDiagnosis.diagnosis_id,
      report: {
        title: reportTitle || '心电图解读报告',
        createdTime: formatDate(doctorDiagnosis.diagnosis.start_time),
        completedTime: formatDate(doctorDiagnosis.completed_time),
      },
      patient: {
        id: doctorDiagnosis.user_id,
        name: doctorDiagnosis.user_name || '-',
        gender: genderMap[doctorDiagnosis.gender || ''] || '-',
        age: doctorDiagnosis.age || 0,
        phone: doctorDiagnosis.user_phone || '-',
      },
      doctor: {
        name: doctorDiagnosis.doctor_name || '-',
        signature: doctorSignature || '',
      },
      diagnosis: {
        conclusion: doctorDiagnosis.conclusion || '-',
        recommendation: doctorDiagnosis.recommendation || '-',
        report: doctorDiagnosis.ecg_analysis_summary || {},
      },
    }
  }
}
