import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { LoginInfoController } from './login_info.controller'
import { LoginInfo, LoginInfoSchema } from './login_info.schema'
import { LoginInfoService } from './login_info.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: LoginInfo.name, schema: LoginInfoSchema }],
      'sharedConnection',
    ),
  ],
  controllers: [LoginInfoController],
  providers: [LoginInfoService],
  exports: [LoginInfoService],
})
export class LoginInfoModule {}
