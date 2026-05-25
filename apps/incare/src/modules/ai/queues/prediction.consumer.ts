import { systemConfig, SystemConfig } from '@incare/config/index'
import {
  OnGlobalQueueError,
  OnQueueError,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bull'
import * as dayjs from 'dayjs'
import { AiService } from '../../ai/ai.service'
import { IPredictionMessage } from '../../comment/comment.interface'
import { DiagnosisService } from '../../diagnosis/diagnosis.service'
import { NotificationService } from '../../notification/notification.service'
import { Language } from '../../shared/enums/common.enum'
import { PredictionStatus } from '../../shared/enums/diagnosis.enum'
import { JOB_NAMES, QUEUE_NAMES } from '../../shared/strings'
import { isValidLanguage, validatePlatform } from '../../shared/utils/util'

@Processor(QUEUE_NAMES.ECG_PREDICTION)
export class PredictionConsumer {
  logger = new Logger(PredictionConsumer.name)
  constructor(
    private readonly diagnosisService: DiagnosisService,
    private readonly aiService: AiService,
    private readonly notificationService: NotificationService,
    @Inject(systemConfig.KEY)
    private readonly config: SystemConfig,
  ) { }

  @Process({ name: JOB_NAMES.ECG_PREDICTION, concurrency: 5 })
  async getPrediction(job: Job<IPredictionMessage>) {
    const {
      user_id,
      third_party_id,
      diagnosis_id,
      measure_time,
      platform,
      default_model,
      lang,
      push_type,
      phone,
    } = job.data

    this.logger.log(
      `[Queue] [${JOB_NAMES.ECG_PREDICTION}] Start: [req_id: ${job.id}] [diagnosis_id: ${diagnosis_id}] [user_id: ${user_id}] [third_party_id: ${third_party_id}] [platform: ${platform}] [lang: ${lang}] push_type: ${push_type}]`,
    )

    const before = Date.now()
    try {
      // 發送請求到 AI Server
      const response = await this.aiService.sendPredictionRequest(diagnosis_id)
      const after = Date.now()

      this.logger.log(
        `[Queue] [${JOB_NAMES.ECG_PREDICTION}] AI Response: [req_id: ${job.id
        }] [diagnosis_id: ${diagnosis_id}] [response: ${JSON.stringify(
          response,
        )}] [duration: ${after - before}ms]`,
      )

      const { result } = response

      // 更新診斷結果狀態
      const updateObject: Record<string, any> = {
        prediction_result: result,
        prediction_status: PredictionStatus.Success,
      }
      if (this.config.changeModelFlag) {
        updateObject.prediction_model = default_model
      }

      await this.diagnosisService.updateDiagnosis(diagnosis_id, updateObject)

      try {
        // send notification
        const platform_enum = validatePlatform(platform) // 直接轉換，確保類型正確
        await this.notificationService.sendNotification(platform_enum, {
          user_id,
          platform,
          diagnosis_id,
          measure_time: dayjs(measure_time).format(),
          lang: isValidLanguage(lang) ? (lang as Language) : Language.EN_US,
          push_type,
          phone,
          third_party_id,
        })
        this.logger.log(
          `[Queue] [${JOB_NAMES.ECG_PREDICTION}] Notification job added: [req_id: ${job.id}] [diagnosis_id: ${diagnosis_id}] [user_id: ${user_id}] [platform: ${platform}] [measure_time: ${measure_time}] [lang: ${lang}]`,
        )
      }
      catch (notification_error) {
        this.logger.error(
          `[Queue] [${JOB_NAMES.ECG_PREDICTION}] Notification job failed: [req_id: ${job.id}] [diagnosis_id: ${diagnosis_id}] [error: ${notification_error.message}]`,
        )
      }

      this.logger.log(
        `[Queue] [${JOB_NAMES.ECG_PREDICTION}] Success: [req_id: ${job.id}] [diagnosis_id: ${diagnosis_id}]`,
      )
    }
    catch (error) {
      this.logger.error(
        `[Queue] [${JOB_NAMES.ECG_PREDICTION}] Failed: [req_id: ${job.id}] [diagnosis_id: ${diagnosis_id}] [error: ${error.message}]`,
      )

      await this.diagnosisService.updateDiagnosis(diagnosis_id, {
        prediction_status: PredictionStatus.Fail,
      })

      this.logger.error(
        `[Queue] [${JOB_NAMES.ECG_PREDICTION}] Failed: [req_id: ${job.id}] [diagnosis_id: ${diagnosis_id}] Update prediction_status:${PredictionStatus.Fail}`,
      )
    }
  }

  @OnQueueError()
  onError(err: Error) {
    console.error(err)
  }

  @OnQueueFailed()
  handler(job: Job, error: Error) {
    console.error(job)
    console.error(error)
  }

  @OnGlobalQueueError()
  onGlobalError(err: Error) {
    console.error(err)
  }
}
