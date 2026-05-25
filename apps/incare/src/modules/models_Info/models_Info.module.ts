import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ModelsInfoController } from './models_Info.controller'
import { ModelsInfo, ModelsInfoSchema } from './models_Info.schema'
import { ModelsInfoService } from './models_Info.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: ModelsInfo.name, schema: ModelsInfoSchema }],
      'sharedConnection',
    ),
  ],
  providers: [ModelsInfoService],
  exports: [ModelsInfoService],
  controllers: [ModelsInfoController],
})
export class ModelsInfoModule {}
