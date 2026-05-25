import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ModelDetailsController } from './model_details.controller'
import { ModelDetails, ModelDetailsSchema } from './model_details.schemas'
import { ModelDetailsService } from './model_details.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: ModelDetails.name, schema: ModelDetailsSchema }],
      'sharedConnection',
    ),
  ],
  providers: [ModelDetailsService],
  controllers: [ModelDetailsController],
  exports: [ModelDetailsService],
})
export class ModelDetailsModule {}
