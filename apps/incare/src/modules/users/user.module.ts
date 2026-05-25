import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from '../auth/auth.module'
import { DiagnosisModule } from '../diagnosis/diagnosis.module'
import { IdentityProfileModule } from '../identity_profile/identity_profile.module'
import SmsService from '../sms/sms.service'
import TwilioService from '../sms/twilio.service'
import { UnregisterModule } from '../unregister/unregister.module'
import { UserController } from './user.controller'
import { User, UserSchema } from './user.schemas'
import { UserService } from './user.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: User.name, schema: UserSchema }],
      'sharedConnection',
    ),
    forwardRef(() => DiagnosisModule),
    forwardRef(() => AuthModule),
    UnregisterModule,
    IdentityProfileModule,
  ],
  controllers: [UserController],
  providers: [UserService, SmsService, TwilioService],
  exports: [UserService],
})
export class UserModule {}
