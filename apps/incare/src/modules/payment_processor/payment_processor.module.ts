import { Module } from '@nestjs/common'
import { IdentityProfileModule } from '../identity_profile/identity_profile.module'
import { OrderModule } from '../order/order.module'
import { PaymentModule } from '../payment/payment.module'
import { PaymentResultAssembler } from './assemblers/payment_result.assembler'
import { PaymentNotifyController, PaymentProcessorController } from './controller'
import { PaymentGatewayRegistry, WechatGateway } from './gateways'
import { PaymentNotifyService, PaymentProcessorService, QueryUserPaymentsService } from './service'

@Module({
  imports: [OrderModule, PaymentModule, IdentityProfileModule],
  controllers: [PaymentProcessorController, PaymentNotifyController],
  providers: [
    PaymentProcessorService,
    PaymentNotifyService,
    QueryUserPaymentsService,
    PaymentGatewayRegistry,
    WechatGateway,
    PaymentResultAssembler,
  ],
})
export class PaymentProcessorModule {}
