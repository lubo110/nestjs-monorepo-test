import { Injectable } from '@nestjs/common'
import { PushMessage } from '../common/push.interface'
import { PushGateway } from './push.gateway'

@Injectable()
export class PushGatewayRegistry {
  private readonly gateways: PushGateway[] = []

  register(gateway: PushGateway) {
    this.gateways.push(gateway)
  }

  get(message: PushMessage) {
    const gateway = this.gateways.find(g => g.canHandle(message))
    if (!gateway) {
      throw new Error(`暂不支持该推送方式：${message.deviceType}`)
    }
    return gateway
  }
}
