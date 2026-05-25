import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UnregisterUser, UnregisterUserSchema } from './unregister.schemas'
import { UnregisterService } from './unregister.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: UnregisterUser.name, schema: UnregisterUserSchema }],
      'sharedConnection',
    ),
  ],
  providers: [UnregisterService],
  exports: [UnregisterService],
})
export class UnregisterModule {}
