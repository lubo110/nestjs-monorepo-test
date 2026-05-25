import { HttpService } from '@nestjs/axios'
import { HttpStatus, Injectable } from '@nestjs/common'
import * as dayjs from 'dayjs'
import { DiagnosisService } from '../diagnosis/diagnosis.service'
import {
  Language,
  Platform,
  WaffleRequestStatus,
} from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { UserService } from '../users/user.service'
import {
  NotificationData,
} from './notification.interface'
import { NotificationProducer } from './queues/notification.producer'

@Injectable()
export class NotificationService {
  constructor(
    private readonly userService: UserService,
    private readonly diagnosisService: DiagnosisService,
    private readonly httpService: HttpService,
    private readonly notificationProducer: NotificationProducer,
  ) {}

  private response: WaffleResponse
  async sendLatestNotificationByPhone(phone: string, platform: Platform) {
    const user = await this.userService.findByIdentifier(phone)
    if (!user) {
      throw new ApiException(
        'user not found',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    else {
      const {
        data: { diagnosis_id },
      } = await this.diagnosisService.findUserLatestDiagnosisId(user.id)

      const timestamp = Date.now()
      await this.sendNotification(platform, {
        platform,
        user_id: user.id,
        diagnosis_id,
        measure_time: dayjs(timestamp).format(),
        lang: Language.EN_US,
      })

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {
          diagnosis_id,
          sent_time: dayjs(timestamp).format(),
        },
        message: `user_id:${user.id} has sent the notification`,
      })
    }
  }

  /**
   * 發送通知到對應的 Queue
   */
  async sendNotification(
    platform: Platform,
    data: NotificationData,
  ): Promise<void> {
    await this.notificationProducer.sendNotification(platform, data)
  }
}
