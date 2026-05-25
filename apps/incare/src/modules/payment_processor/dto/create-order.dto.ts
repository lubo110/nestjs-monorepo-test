import { IsNumber, IsOptional, IsString } from 'class-validator'
import { PaymentMethod } from '@incare/modules/shared/enums/common.enum'

export class CreateOrderDTO {
  @IsString()
  product_id: string

  /**
   * 1为微信支付，2为支付宝
   */
  @IsNumber()
  @IsOptional()
  pay_type?: PaymentMethod = PaymentMethod.WECHAT
}
