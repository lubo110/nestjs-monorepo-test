import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { OrderStatus, ProductType } from './order.enum'

export type OrderDocument = HydratedDocument<Order>
@Schema({
  collection: 'orders', // 指定 MongoDB 中的集合名称为 diagnoses
  timestamps: {
    createdAt: 'create_time',
    updatedAt: 'update_time',
  },
})
export class Order {
  /**
   * 订单号
   */
  @Prop({ required: true, unique: true, index: true })
  order_id: string

  @Prop({ required: true, index: true })
  user_id: string

  /**
   * 【微信支付订单号】 微信支付侧订单的唯一标识
   */
  @Prop()
  transaction_id: string

  @Prop({ required: true })
  product_id: string

  @Prop({ required: true })
  product_name: string

  @Prop({ required: true, type: String })
  product_type: ProductType

  @Prop()
  note: string

  /**
   * 1为微信支付，2为支付宝
   */
  @Prop({ default: 1 })
  pay_type: number

  /**
   * 订单总金额（以分为单位的整数，对应微信支付的金额参数）
   * 例如：199元 → 存储为19900
   */
  @Prop({ min: 0 })
  total_amount: number

  /**
   * 订单支付金额（以分为单位的整数，对应微信支付的金额参数）
   * 例如：199元 → 存储为19900
   */
  @Prop({ min: 0 })
  pay_amount: number

  @Prop({ default: 'CNY', enum: ['CNY', 'USD', 'EUR'] })
  currency: string

  /**
   * 支付状态
   * 使用枚举限制值，同时设置默认值为NOTPAY（未支付）
   * SUCCESS：支付成功   REFUND：转入退款   NOTPAY：未支付   CLOSED：已关闭
   */
  @Prop({
    type: String, // MongoDB中存储为字符串类型
    enum: Object.values(OrderStatus), // 限制只能是枚举中的值
    default: OrderStatus.NOTPAY, // 可选：设置默认状态为未支付
    required: true,
  })
  status: OrderStatus

  /**
   * 【交易状态描述】 对交易状态的详细说明
   */
  @Prop()
  trade_state_desc: string

  @Prop()
  closed_reason: string

  /**
   * 【交易类型】 返回当前订单的交易类型，枚举值：
        JSAPI：公众号支付、小程序支付
        NATIVE：Native支付
        APP：APP支付
        MICROPAY：付款码支付
        MWEB：H5支付
        FACEPAY：刷脸支付
   */
  @Prop()
  trade_type: string

  @Prop()
  create_time: Date

  @Prop()
  update_time: Date

  /**
   * 支付完成时间
   */
  @Prop()
  pay_time: Date

  @Prop()
  start_time: Date

  @Prop()
  end_time: Date

  @Prop()
  closed_time: Date
}

export const OrderSchema = SchemaFactory.createForClass(Order)
