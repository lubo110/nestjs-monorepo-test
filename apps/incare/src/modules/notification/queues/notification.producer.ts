import { Injectable, Logger } from '@nestjs/common'
import { Platform } from '../../shared/enums/common.enum'
import { retryBackoffDelays } from '../notification.constant'
import { NotificationData } from '../notification.interface'
import { NotificationQueueFactory } from './notification_queue.factory'

@Injectable()
export class NotificationProducer {
  logger = new Logger(NotificationProducer.name)
  constructor(private readonly queueFactory: NotificationQueueFactory) {}

  /**
   * 發送通知到對應的 Queue
   * @param platform - 通知平台
   * @param data - 通知資料
   */
  async sendNotification(
    platform: Platform,
    data: NotificationData,
  ): Promise<void> {
    try {
      const { queue, jobName } = this.queueFactory.create(platform)
      if (platform === Platform.THIRD_PARTY) {
        await queue.add(jobName, data, {
          attempts: retryBackoffDelays.length + 1,
          backoff: {
            type: 'custom',
          },
          removeOnComplete: true,
          removeOnFail: true,
        })
      }
      else {
        await queue.add(jobName, data, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          timeout: 10000,
        })
      }

      this.logger.log(
        `[sendNotification] Added to ${platform} notification queue successfully,the jobName is ${jobName} `,
      )
    }
    catch (error) {
      this.logger.warn(error.message)
    }
  }
}
