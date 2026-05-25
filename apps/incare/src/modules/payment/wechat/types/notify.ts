/**
 * 微信支付回调通知类型
 */
import { Amount, Payer, PromotionDetail, SceneInfo } from './common'

/** 微信支付事件通知中的资源信息 */
export interface WeChatPayNotifyResource {
  original_type: string
  algorithm: string
  ciphertext: string
  associated_data: string
  nonce: string
}

/** 微信支付事件通知主类型 */
export interface WeChatPayNotifyResult {
  id: string
  create_time: string
  resource_type: string
  event_type: string
  summary: string
  resource: WeChatPayNotifyResource
}

/** 微信支付回调解密结果 */
export interface WeChatPayDecryptResult {
  transaction_id: string
  amount: Amount
  mchid: string
  trade_state: string
  bank_type: string
  promotion_detail: PromotionDetail[]
  success_time: string
  payer: Payer
  out_trade_no: string
  appid: string
  trade_state_desc: string
  trade_type: string
  attach: string
  scene_info: SceneInfo
}
