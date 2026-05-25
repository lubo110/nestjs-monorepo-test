import { Module } from '@nestjs/common'
import { FirebaseGateway } from './firebase.gateway'
import { FirebaseService } from './firebase.service'

@Module({
  providers: [FirebaseService, FirebaseGateway],
})
export class FirebaseModule {}
