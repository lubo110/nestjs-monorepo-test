import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bull'
import { Platform } from '../../shared/enums/common.enum'
import { JOB_NAMES, QUEUE_NAMES } from '../../shared/strings'

@Injectable()
export class NotificationQueueFactory {
  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION_THIRD_PARTY)
    private readonly thirdPartyQueue: Queue,
     @InjectQueue(QUEUE_NAMES.NOTIFICATION_PUSH)
    private readonly pushQueue: Queue,
  ) {}

  create(platform: Platform): { queue: Queue, jobName: string } {
    switch (platform) {
      case Platform.THIRD_PARTY:
        return {
          queue: this.thirdPartyQueue,
          jobName: JOB_NAMES.NOTIFICATION_THIRD_PARTY,
        }
      case Platform.MOBILE:
      case Platform.IOS:
      case Platform.ANDROID:
        return {
          queue: this.pushQueue,
          jobName: JOB_NAMES.NOTIFICATION_PUSH,
        }
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }
}
