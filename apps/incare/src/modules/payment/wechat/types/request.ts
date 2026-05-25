/**
 * 请求参数类型
 */

export interface RequestOptions {
  method: 'GET' | 'POST'
  url: string
  body?: Record<string, any>
}

export interface SignatureOptions extends RequestOptions {
  timestamp: string
  nonce: string
}

/** 创建微信 APP 支付预支付订单请求参数 */
export interface CreateWechatAppOrderInput {
  outTradeNo: string
  description: string
  amount: number
}
