import { PaymentMethod } from '../../shared/enums/common.enum'
import { ValidStatus } from '../enum/valid-status.enum'

export interface ConfirmPaymentResult {
  order_id: string
  product_name: string
  product_id: string
  create_time: string
  pay_time: string
  expire_time: string
  amount: number
  status: ValidStatus
  pay_type: PaymentMethod
}
