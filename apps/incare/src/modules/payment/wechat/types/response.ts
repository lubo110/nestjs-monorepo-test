/**
 * 微信API响应类型
 */
import { Amount, Payer, PromotionDetail, SceneInfo } from './common'

/** 微信统一下单接口返回 */
export interface WechatPayOrderResponse {
  prepay_id: string
}

/** 微信支付订单查询返回结果 */
export interface WechatPayOrderQueryResult {
  appid: string
  mchid: string
  out_trade_no: string
  transaction_id: string
  trade_type: string
  trade_state: string
  trade_state_desc: string
  bank_type: string
  attach?: string
  success_time: string
  payer: Payer
  amount: Amount
  scene_info?: SceneInfo
  promotion_detail?: PromotionDetail[]
}
