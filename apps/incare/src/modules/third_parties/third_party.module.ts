import { BullModule } from '@nestjs/bull'
import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AiModule } from '../ai/ai.module'
import { PredictionProducer } from '../ai/queues/prediction.producer'
import { DiagnosisModule } from '../diagnosis/diagnosis.module'
import { ModelsInfoModule } from '../models_Info/models_Info.module'
import { NotificationModule } from '../notification/notification.module'
import { ApiKeyService } from '../shared/common/api-key.service'
import { QUEUE_NAMES } from '../shared/strings'
import { ThirdPartyUserMappingModule } from '../third_party_user_mappings/third_party_user_mapping.module'
import { ThirdPartyController } from './third_party.controller'
import { ThirdParty, ThirdPartySchema } from './third_party.schema'
import { ThirdPartyService } from './third_party.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: ThirdParty.name, schema: ThirdPartySchema }],
      'sharedConnection',
    ),
    forwardRef(() => ThirdPartyUserMappingModule),
    BullModule.registerQueue({
      name: QUEUE_NAMES.ECG_PREDICTION,
      limiter: { max: 10, duration: 50 },
    }),
    DiagnosisModule,
    ModelsInfoModule,
    AiModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [ThirdPartyController],
  providers: [ThirdPartyService, ApiKeyService, PredictionProducer],
  exports: [ThirdPartyService],
})
export class ThirdPartyModule {}
