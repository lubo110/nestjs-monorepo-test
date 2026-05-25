import { ECGPredictionNotificationMessages } from '@incare/modules/shared/common.response'
import { Language } from '@incare/modules/shared/enums/common.enum'
import { JOB_NAMES, QUEUE_NAMES } from '@incare/modules/shared/strings'
import { Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bull'
import { PushMessage } from '../../push/common/push.interface'
import { PushService } from '../../push/push.service'
import {
  ECGPredictionNotification,
  NotificationData,
} from '../notification.interface'

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATION_PUSH)
export class NotificationPushProcessor {
  private readonly logger = new Logger(NotificationPushProcessor.name)
  constructor(
    private readonly pushService: PushService,
  ) {}

  @Process(JOB_NAMES.NOTIFICATION_PUSH)
  async processPushNotification(job: Job<NotificationData>) {
    const data = job.data
    this.logger.log(
      `[Queue] [${JOB_NAMES.NOTIFICATION_PUSH}] Notification Start: [job_id: ${job.id}] [diagnosis_id: ${data.diagnosis_id}]`,
    )
    let message: PushMessage
    // 1. 数据准备阶段
    try {
      message = this.prepareData(data)
    }
    catch (err) {
      this.logger.error(
        `[Queue] [${JOB_NAMES.NOTIFICATION_PUSH}] PrepareData Error: ${err}`,
      )
      return
    }
    this.pushService.send(message).then((res) => {
      this.logger.log(
        `[Queue] [${JOB_NAMES.NOTIFICATION_PUSH}] ${res.message}`,
      )
    }).catch((err) => {
      this.logger.error(`[Queue] [${
        JOB_NAMES.NOTIFICATION_PUSH
      }] Push Notification Sent error: ${err}`)
    })
  }

  private prepareData(data: NotificationData) {
    // 獲取 lang，默認為 "en"
    const lang = data.lang || Language.EN_US
    // 從映射表提取語言內容，默認回退到 "en_us"
    const { title, message } = this.getNotificationMessage(lang)
    const { diagnosis_id, measure_time, user_id: userId, phone, push_type: pushType } = data
    const deviceType = data.platform// this.validatePlatform(data.platform)
    const payload: PushMessage = {
      title,
      body: message,
      extras: {
        diagnosis_id,
        measure_time,
      },
      userId,
      deviceType,
      pushType,
      phone,
    }
    return payload
  }

  // 函數來獲取通知內容
  private getNotificationMessage(lang: Language): ECGPredictionNotification {
    // 如果提供的語言未設置，則回退到默認語言
    return ECGPredictionNotificationMessages[lang]
  }
}
