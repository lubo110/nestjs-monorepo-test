import { Injectable } from '@nestjs/common'
import { PaymentMethod } from '../../shared/enums/common.enum'
import { PaymentGateway } from './payment.gateway'

@Injectable()
export class PaymentGatewayRegistry {
  private readonly gateways = new Map<PaymentMethod, PaymentGateway>()

  register(gateway: PaymentGateway) {
    const provider = gateway.provider as PaymentMethod
    if (!provider)
      return
    this.gateways.set(provider, gateway)
  }

  get<T extends PaymentGateway = PaymentGateway>(
    provider: PaymentMethod,
  ): T {
    const gateway = this.gateways.get(provider)
    if (!gateway) {
      throw new Error(`暂不支持该支付方式：${provider}`)
    }

    return gateway as T
  }

  getAll() {
    return Array.from(this.gateways.values())
  }
}
