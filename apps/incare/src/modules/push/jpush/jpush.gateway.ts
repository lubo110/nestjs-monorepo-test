import { Injectable } from '@nestjs/common'
import { Platform } from '@incare/modules/shared/enums/common.enum'
import { JPUSH_CHANNEL } from '../common/push.constants'
import { PushMessage } from '../common/push.interface'
import { PushGateway } from '../gateways/push.gateway'
import { PushGatewayRegistry } from '../gateways/push.gateway.registry'
import { JPushService } from './jpush.service'

@Injectable()
export class JpushGateway extends PushGateway {
  constructor(
    private readonly jpushService: JPushService,
    registry: PushGatewayRegistry,
  ) {
    super(registry)
  }

  canHandle(message: PushMessage): boolean {
    const platform = this.validatePushPlatform(message.deviceType)
    return (platform === Platform.ANDROID || platform === Platform.MOBILE) && message.pushType === JPUSH_CHANNEL
  }

  async send(message: PushMessage) {
    return this.jpushService.send(message)
  }
}
