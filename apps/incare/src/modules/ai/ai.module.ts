import { HttpModule } from '@nestjs/axios'
import { BullModule } from '@nestjs/bull'
import { forwardRef, Module } from '@nestjs/common'
import { CoreModule } from '../@core/core.module'
import { ConfigurationModule } from '../configuration/configuration.module'
import { DiagnosisModule } from '../diagnosis/diagnosis.module'
import { MeasuresModule } from '../measures/measure.module'
import { NotificationModule } from '../notification/notification.module'
import { QUEUE_NAMES } from '../shared/strings'
import { AiService } from './ai.service'
import { PredictionConsumer } from './queues/prediction.consumer'
import { PredictionProducer } from './queues/prediction.producer'

@Module({
  imports: [
    HttpModule,
    CoreModule,
    MeasuresModule,
    forwardRef(() => DiagnosisModule),
    forwardRef(() => NotificationModule),
    ConfigurationModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.ECG_PREDICTION,
      limiter: { max: 10, duration: 50 },
    }),
  ],
  providers: [AiService, PredictionProducer, PredictionConsumer],
  exports: [AiService],
})
export class AiModule {}
