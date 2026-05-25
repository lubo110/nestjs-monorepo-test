import { Injectable } from '@nestjs/common'
import { Platform } from '@incare/modules/shared/enums/common.enum'
import { JPUSH_CHANNEL } from '../common/push.constants'
import { PushMessage } from '../common/push.interface'
import { PushGateway } from '../gateways/push.gateway'
import { PushGatewayRegistry } from '../gateways/push.gateway.registry'
import { FirebaseService } from './firebase.service'

@Injectable()
export class FirebaseGateway extends PushGateway {
  constructor(
    private readonly firebaseService: FirebaseService,
    registry: PushGatewayRegistry,
  ) {
    super(registry)
  }

  canHandle(message: PushMessage) {
    const platform = this.validatePushPlatform(message.deviceType)
    return (platform === Platform.ANDROID || platform === Platform.MOBILE)
      && message.pushType !== JPUSH_CHANNEL
  }

  async send(message: PushMessage) {
    return this.firebaseService.send(message)
  }
}
