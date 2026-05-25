/**
 * APP支付签名返回类型
 */
export interface AppPaySignResult {
  app_id: string
  partner_id: string
  prepay_id: string
  package: string
  nonce: string
  timestamp: string
  sign: string
}
