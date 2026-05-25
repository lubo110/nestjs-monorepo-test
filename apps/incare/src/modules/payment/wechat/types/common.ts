/**
 * 公共复用类型
 */

/** 金额信息 */
export interface Amount {
  /** 订单总金额，单位为分 */
  total: number
  /** 支付者实际支付金额，单位为分 */
  payer_total: number
  /** 订单货币类型 */
  currency: string
  /** 支付者支付货币类型 */
  payer_currency: string
}

/** 支付者信息 */
export interface Payer {
  /** 用户在商户appid下的唯一标识 */
  openid: string
}

/** 场景信息 */
export interface SceneInfo {
  /** 商户设备号 */
  device_id: string
}

/** 商品详情类型 */
export interface GoodsDetail {
  goods_remark: string
  quantity: number
  discount_amount: number
  goods_id: string
  unit_price: number
}

/** 优惠详情类型 */
export interface PromotionDetail {
  amount: number
  wechatpay_contribute: number
  coupon_id: string
  scope: string
  merchant_contribute: number
  name: string
  other_contribute: number
  currency: string
  stock_id: string
  goods_detail: GoodsDetail[]
}
