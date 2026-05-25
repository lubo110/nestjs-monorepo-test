import { Injectable } from '@nestjs/common'
import { Platform } from '@incare/modules/shared/enums/common.enum'
import { PushMessage } from '../common/push.interface'
import { PushGateway } from '../gateways/push.gateway'
import { PushGatewayRegistry } from '../gateways/push.gateway.registry'
import { ApnService } from './apn.service'

@Injectable()
export class ApnGateway extends PushGateway {
  constructor(
    private readonly apnService: ApnService,
    registry: PushGatewayRegistry,
  ) {
    super(registry)
  }

  canHandle(message: PushMessage): boolean {
    return this.validatePushPlatform(message.deviceType) === Platform.IOS
  }

  async send(message: PushMessage) {
    return this.apnService.send(message)
  }
}
