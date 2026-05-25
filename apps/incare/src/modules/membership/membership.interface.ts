import { ProductType } from '../order/order.enum'
import { MembershipSource } from './membership.enum'

export interface EnsureActiveMembershipOptions {
  userId: string
  productType: ProductType
  sourceId: string
  source?: MembershipSource
  payTime: Date
}
