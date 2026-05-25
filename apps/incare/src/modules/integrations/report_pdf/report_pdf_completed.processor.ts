import { Platform } from '@incare/modules/shared/enums/common.enum'
import { SmsType } from '@incare/modules/shared/enums/sms_type.enum'
import { JOB_NAMES, QUEUE_NAMES } from '@incare/modules/shared/strings'
import { formatDate } from '@incare/modules/shared/utils/util'
import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { AliCloudSmsService } from '../../alicloud_sms/alicloud_sms.service'
import { DoctorDiagnosisService } from '../../doctor_diagnosis/doctor_diagnosis.service'
import { DoctorDiagnosisWithDiagnosis } from '../../doctor_diagnosis/types'
import { JPUSH_CHANNEL } from '../../push/common/push.constants'
import { PushService } from '../../push/push.service'
import { DoctorReportMarkCompletedPayload } from './report_pdf.interface'

@Processor(QUEUE_NAMES.DOCTOR_REPORT_PDF_COMPLETED)
export class ReportPdfCompletedProcessor {
  private readonly logger = new Logger(ReportPdfCompletedProcessor.name)

  constructor(
    private readonly aliCloudSmsService: AliCloudSmsService,
    private readonly pushService: PushService,
    private readonly doctorDiagnosisService: DoctorDiagnosisService,
  ) {}

  @Process(JOB_NAMES.DOCTOR_REPORT_MARK_COMPLETED)
  async handleCompleted(job: Job<DoctorReportMarkCompletedPayload>) {
    const { diagnosisId, fileKey } = job.data
    const logPrefix = `[diagnosisId=${diagnosisId}]`

    this.logger.log(`${logPrefix} [START] PDF报告生成完成,开始后续处理...`)
    this.logger.debug(`${logPrefix} Job 数据: ${JSON.stringify(job.data)}`)

    try {
      const doctorDiagnosis = await this.bindPdf(diagnosisId, fileKey, logPrefix)

      await this.notifyUser(doctorDiagnosis, diagnosisId, logPrefix)

      this.logger.log(`${logPrefix} [END] 所有操作完成，处理成功`)
    }
    catch (error) {
      this.logger.error(
        `${logPrefix} [ERROR] PDF处理失败，原因：${error?.message}`,
        error?.stack,
      )
      throw error
    }
  }

  /**
   * 绑定 PDF（核心流程，失败直接抛错）
   */
  private async bindPdf(diagnosisId: string, fileKey: string, logPrefix: string) {
    this.logger.log(`${logPrefix} 开始绑定 PDF`)

    const doctorDiagnosis = await this.doctorDiagnosisService.bindPdfFile(diagnosisId, fileKey)

    this.logger.log(`${logPrefix} PDF 绑定成功`)
    return doctorDiagnosis
  }

  /**
   * 用户通知（副作用流程）
   * 任一失败不影响主流程
   */
  private async notifyUser(
    doctorDiagnosis: DoctorDiagnosisWithDiagnosis,
    diagnosisId: string,
    logPrefix: string,
  ) {
    await Promise.allSettled([
      this.sendSms(doctorDiagnosis, logPrefix),
      this.sendPush(doctorDiagnosis, diagnosisId, logPrefix),
    ])
  }

  /**
   * 发送短信
   */
  private async sendSms(doctorDiagnosis: any, logPrefix: string) {
    const phone = doctorDiagnosis.user_phone

    try {
      this.logger.log(`${logPrefix} 发送短信通知，phone=${phone}`)

      const res = await this.aliCloudSmsService.sendSms(
        phone,
        { time: formatDate(doctorDiagnosis.created_time) },
        SmsType.REPORT_READY,
      )

      this.logger.debug(`${logPrefix} 短信发送成功，结果=${JSON.stringify(res)}`)
    }
    catch (error) {
      this.logger.error(`${logPrefix} 短信发送失败，phone=${phone}，原因=${error?.message}`, error)
    }
  }

  /**
   * 发送推送
   */
  private async sendPush(
    doctorDiagnosis: DoctorDiagnosisWithDiagnosis,
    diagnosisId: string,
    logPrefix: string,
  ) {
    try {
      const deviceType = doctorDiagnosis.platform
      const { title, message: body } = this.getNotificationMessage()

      this.logger.log(`${logPrefix} 发送推送通知，userId=${doctorDiagnosis.user_id} deviceType=${deviceType}`)
      // 默认只有中国用户
      const pushType = deviceType === Platform.ANDROID ? JPUSH_CHANNEL : undefined
      const result = await this.pushService.send({
        deviceType,
        userId: doctorDiagnosis.user_id,
        title,
        body,
        extras: {
          diagnosis_id: diagnosisId,
          measure_time: doctorDiagnosis.diagnosis.start_time,
        },
        phone: doctorDiagnosis.user_phone,
        pushType,
      })

      this.logger.debug(`${logPrefix} ${result.message}`)
    }
    catch (error) {
      this.logger.error(`${logPrefix} 推送发送失败，userId=${doctorDiagnosis.user_id}，原因=${error?.message}`, error)
    }
  }

  private getNotificationMessage() {
    return {
      title: '已收到心电图解读报告。',
      message: '医生已完成您的心电图解读报告，您可以查阅了。',
    }
  }
}
