import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Anomaly, AnomalySchema } from './anomaly.schemas'
import { AnomalyService } from './anomaly.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Anomaly.name, schema: AnomalySchema }],
      'sharedConnection',
    ),
  ],
  providers: [AnomalyService],
  exports: [AnomalyService],
})
export class AnomalyModule {}
