import { Module } from '@nestjs/common'
import { ApnModule } from './apn/apn.module'
import { FirebaseModule } from './firebase/firebase.module'
import { JpushModule } from './jpush/jpush.module'
import { PushRegistryModule } from './push.registry'
import { PushService } from './push.service'

@Module({
  imports: [ApnModule, JpushModule, FirebaseModule, PushRegistryModule],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
