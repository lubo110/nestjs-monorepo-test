import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DoctorUserController } from './doctor_user.controller'
import { DoctorUser, DoctorUserSchema } from './doctor_user.schemas'
import { DoctorUserService } from './doctor_user.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: DoctorUser.name, schema: DoctorUserSchema }],
      'sharedConnection',
    ),
  ],
  controllers: [DoctorUserController],
  providers: [DoctorUserService],
  exports: [DoctorUserService],
})
export class DoctorUserModule {}
