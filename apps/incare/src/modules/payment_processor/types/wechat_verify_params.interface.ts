export interface WechatVerifyParams {
  /**
   * 报文主体
   */
  rawBody: string
  /**
   * 签名
   */
  signature: string
  /**
   * 随机串
   */
  nonce: string
  /**
   * 时间戳
   */
  timestamp: string
  /**
   * 微信支付公钥序列号
   */
  serial: string
}
