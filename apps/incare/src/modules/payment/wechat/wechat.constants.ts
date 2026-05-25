/**
 * 微信支付 V3 接口 URL 常量
 * 支持固定路径和动态路径函数
 */
export const WECHAT_PAY_API = {
  // ---------------- 固定 URL ----------------
  APP_PREPAY: '/v3/pay/transactions/app',

  // ---------------- 动态 URL ----------------
  queryOrderByOutTradeNo: (outTradeNo: string, mchId: string) =>
    `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${mchId}`,

  closeOrderByOutTradeNo: (outTradeNo: string) =>
    `/v3/pay/transactions/out-trade-no/${outTradeNo}/close`,
} as const
