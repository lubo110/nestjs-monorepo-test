import { Injectable, Logger } from '@nestjs/common'
import { PushMessage } from './common/push.interface'
import { PushGatewayRegistry } from './gateways/push.gateway.registry'

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name)
  constructor(
    private readonly registry: PushGatewayRegistry,
  ) {}

  async send(message: PushMessage) {
    this.logger.log(`[send] 消息推送开始，推送参数为:${JSON.stringify(message)}`)
    const gateway = this.registry.get(message)
    return gateway.send(message)
  }
}
