import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { Measure, MeasureSchema } from './measure.schemas'
import { MeasureService } from './measure.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Measure.name, schema: MeasureSchema }],
      'sharedConnection',
    ),
  ],
  providers: [MeasureService],
  exports: [MeasureService],
})
export class MeasuresModule {}
