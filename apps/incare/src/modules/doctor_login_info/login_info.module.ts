import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DoctorLoginInfoController } from './login_info.controller'
import { DoctorLoginInfoSchema, DotorLoginInfo } from './login_info.schema'
import { DoctorLoginInfoService } from './login_info.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: DotorLoginInfo.name, schema: DoctorLoginInfoSchema }],
      'sharedConnection',
    ),
  ],
  controllers: [DoctorLoginInfoController],
  providers: [DoctorLoginInfoService],
  exports: [DoctorLoginInfoService],
})
export class DoctorLoginInfoModule {}
