import { HttpModule } from '@nestjs/axios'
import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { DiagnosisModule } from '../diagnosis/diagnosis.module'
import { PushModule } from '../push/push.module'
import { QUEUE_NAMES } from '../shared/strings'
import { UserModule } from '../users/user.module'
import { retryBackoffDelays } from './notification.constant'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { NotificationProducer } from './queues/notification.producer'
import { NotificationPushProcessor } from './queues/notification_push.processor'
import { NotificationQueueFactory } from './queues/notification_queue.factory'
import { NotificationThirdPartyProcessor } from './queues/notification_third_party.processor'

@Module({
  imports: [
    UserModule,
    PushModule,
    DiagnosisModule,
    HttpModule,
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.NOTIFICATION_THIRD_PARTY,
        settings: {
          backoffStrategies: {
            custom: (attemptsMade: number) => {
              return retryBackoffDelays[attemptsMade - 1] ?? null
            },
          },
        },
      },
      {
        name: QUEUE_NAMES.NOTIFICATION_PUSH,
      },
    ),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationProducer,
    NotificationThirdPartyProcessor,
    NotificationQueueFactory,
    NotificationPushProcessor,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
