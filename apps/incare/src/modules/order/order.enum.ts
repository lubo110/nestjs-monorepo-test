/**
 * 订单支付状态枚举
 * SUCCESS：支付成功
 * REFUND：转入退款
 * NOTPAY：未支付
 * CLOSED：已关闭
 * REVOKED：已撤销（仅付款码支付会返回）
 * USERPAYING：用户支付中（仅付款码支付会返回）
 * PAYERROR：支付失败（仅付款码支付会返回）
 */
export enum OrderStatus {
  SUCCESS = 'SUCCESS',
  REFUND = 'REFUND',
  NOTPAY = 'NOTPAY',
  CLOSED = 'CLOSED',
  REVOKED = 'REVOKED',
  USERPAYING = 'USERPAYING',
  PAYERROR = 'PAYERROR',
  FAILED = 'FAILED',
}
export enum ValidStatus {
  /** 生效中 */
  ACTIVE = 1,
  /** 已过期 */
  EXPIRED = 2,
}
export enum ProductType {
  YEAR = 'year',
  MONTH = 'month',
}
