import { Injectable, Logger } from '@nestjs/common'
import * as moment from 'moment'
import { MembershipService } from '../../membership/membership.service'
import { OrderStatus, ProductType } from '../order.enum'
import { OrderRepository } from '../order.repository'
import { Order } from '../order.schema'
import { calculateEndTime, generateOrderNo } from '../order.util'
import { ProductService } from './product.service'

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name)

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productService: ProductService,
    private readonly membershipService: MembershipService,
  ) {}

  async getUserPaymentHistory(userId: string) {
    return this.orderRepository.findSuccessOrdersByUserId(userId)
  }

  async markOrderFailed(orderId: string) {
    return this.orderRepository.markOrderFailed(orderId)
  }

  /**
   * 创建订单（不计算 start/end 时间）
   */
  async createOrder(productId: string, userId: string): Promise<Order> {
    const product = await this.productService.getActiveProduct(productId)

    const order = await this.orderRepository.create({
      user_id: userId,
      product_id: product.product_id,
      product_name: product.product_name,
      product_type: product.product_type,
      total_amount: product.actual_amount,
      note: product.product_desc,
      status: OrderStatus.NOTPAY,
      order_id: generateOrderNo(),
    })

    this.logger.log(`[createOrder] 创建订单成功: ${order.order_id}`)
    return order
  }

  /**
   * 支付成功
   */
  async handlePaymentSuccess(orderId: string, extraData?: Partial<Order>): Promise<Order | null> {
    // 尝试标记订单支付成功
    const order = await this.orderRepository.markOrderPaid(orderId, extraData)
    // 幂等性处理：如果已经是 SUCCESS，直接查成功订单
    if (!order) {
      return await this.orderRepository.findSuccessOrderById(orderId)
    }
    // 开启全局事务会话（管理订单+会员的原子操作）
    const globalSession = await this.orderRepository.startSession()
    globalSession.startTransaction()
    try {
    // 前端按订单展示有效期，order冗余了start_time 和 end_time，这里需要计算
      if (!order.start_time || !order.end_time) {
        const startTime = await this.calculateStartTime(order.user_id, order.pay_time)
        const endTime = calculateEndTime(startTime, order.product_type as ProductType)
        order.start_time = startTime
        order.end_time = endTime
        await order.save({ session: globalSession })
      }
      // 把会员状态写入 membership
      await this.membershipService.ensureActiveMembership({
        userId: order.user_id,
        productType: order.product_type,
        sourceId: order.order_id,
        payTime: order.pay_time, // 支付时间作为会员生效时间
      }, globalSession)
      await globalSession.commitTransaction()
      this.logger.log(`[handlePaymentSuccess] 订单支付成功，order_id： ${orderId}`)
      return order
    }
    catch (error) {
      // 6. 任意一步失败，回滚全局事务
      await globalSession.abortTransaction()
      this.logger.error(`[handlePaymentSuccess] 订单处理失败（事务回滚），order_id： ${orderId}，错误：${(error as Error).message}`)
      throw error // 抛出异常供上层处理
    }
    finally {
      // 7. 释放全局会话
      globalSession.endSession()
    }
  }

  /**
   * 标记订单关闭（仅关闭未支付订单）
   */
  async markOrderClosed(orderId: string): Promise<Order | null> {
    const order = await this.orderRepository.markOrderClosed(orderId)
    if (!order) {
      this.logger.log(`[markOrderClosed] 订单已关闭或不存在: ${orderId}`)
      return null
    }
    this.logger.log(`[markOrderClosed] 订单关闭成功: ${orderId}`)
    return order
  }

  /**
   * 计算新订单开始时间（按最新支付成功订单叠加）
   */
  private async calculateStartTime(userId: string, payTime: Date) {
    const orders = await this.orderRepository.findSuccessOrdersByUserId(userId)
    if (!Array.isArray(orders) || !orders.length) {
      return payTime
    }

    const latestOrder = orders[0]
    const endTime = latestOrder.end_time
    if (!endTime) {
      return payTime
    }
    const currentTime = moment()
    const latestEndTime = moment(endTime)

    return latestEndTime.isSameOrBefore(currentTime) ? payTime : latestEndTime.toDate()
  }
}
