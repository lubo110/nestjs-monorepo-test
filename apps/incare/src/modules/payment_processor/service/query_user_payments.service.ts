import { Injectable } from '@nestjs/common'
import { OrderService } from '../../order/service'
import { PaymentResultAssembler } from '../assemblers/payment_result.assembler'

@Injectable()
export class QueryUserPaymentsService {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentResultAssembler: PaymentResultAssembler,
  ) {}

  async execute(userId: string) {
    const orders = await this.orderService.getUserPaymentHistory(userId)
    return orders.map(order => this.paymentResultAssembler.build(order))
  }
}
