import { CurrentUser } from '@incare/modules/shared/decorators/current_user.decorator'

import { SuccessMessage } from '@incare/modules/shared/decorators/success_message.decorator'
import { WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'
import { ResponseInterceptor } from '@incare/modules/shared/interceptors/response.interceptor'
import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common'
import { IdentityProfileService } from '../../identity_profile/identity_profile.service'
import { LoggerInterceptor } from '../../shared/interceptors/logger.interceptor'
import { CloseOrderDTO, CreateOrderDTO, QueryOrderDTO } from '../dto'
import { PaymentProcessorService } from '../service/payment_processor.service'

@UseInterceptors(LoggerInterceptor, ResponseInterceptor)
@Controller('payments')
export class PaymentProcessorController {
  constructor(
    private readonly paymentProcessorService: PaymentProcessorService,
    private readonly identityProfileService: IdentityProfileService,
  ) { }

  @Post('create')
  async createPayment(@CurrentUser('id') userId: string, @Body() body: CreateOrderDTO) {
    // 判断是否已实名
    const identity = await this.identityProfileService.findByUserId(userId)
    if (!identity) {
      return {
        code: WaffleRequestStatus.USER_NOT_VERIFIED,
        message: '用户未实名!',
        data: null,
      }
    }
    return this.paymentProcessorService.createPayment(body, userId)
  }

  @Post('close')
  async closePayment(
    @Body() body: CloseOrderDTO,
  ) {
    return this.paymentProcessorService.closePayment(body)
  }

  @Post('confirm')
  async confirmPayment(@Body() body: QueryOrderDTO) {
    return this.paymentProcessorService.confirmPayment(body)
  }

  @SuccessMessage('订单查询成功')
  @Get('orders')
  queryPayments(@CurrentUser('id') userId: string) {
    return this.paymentProcessorService.queryUserPayments(userId)
  }
}
