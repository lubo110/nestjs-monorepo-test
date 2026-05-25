export const ServiceNames: string[] = ['v1', 'v2', 'pet']

export const QUEUE_NAMES = {
  NOTIFICATION_THIRD_PARTY: 'notification_third_party_queue',
  // 增加_v2后缀，避免与v1的队列冲突
  ECG_PREDICTION: 'ecg_prediction_queue_v2',
  NOTIFICATION_PUSH: 'notification_push_queue',
  DOCTOR_REPORT_PDF_GENERATE: 'queue:doctor:report:pdf_generate',
  DOCTOR_REPORT_PDF_COMPLETED: 'queue:doctor:report:pdf_completed',
} as const

export const JOB_NAMES = {
  NOTIFICATION_THIRD_PARTY: 'notification_third_party_job',
  ECG_PREDICTION: 'ecg_prediction_job',
  NOTIFICATION_PUSH: 'notification_push_job',
  DOCTOR_REPORT_GENERATE_PDF: 'job:doctor:report:generate_pdf',
  DOCTOR_REPORT_MARK_COMPLETED: 'job:doctor:report:mark_completed',
} as const
