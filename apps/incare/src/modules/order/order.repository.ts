import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, FilterQuery, Model, SortOrder, UpdateQuery } from 'mongoose'
import { OrderStatus } from './order.enum'
import { Order, OrderDocument } from './order.schema'

@Injectable()
export class OrderRepository {
  // 注入共享连接的 Order 模型
  constructor(
    @InjectModel(Order.name, 'sharedConnection')
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  /**
   * 通用查询方法：根据筛选条件查询订单（复用基础查询逻辑）
   * @param filter 筛选条件
   * @param sort 排序规则（可选）
   */
  private findOrders(filter: FilterQuery<OrderDocument>, sort?: Record<string, SortOrder>) {
    let query = this.orderModel.find(filter)
    if (sort) {
      query = query.sort(sort)
    }
    return query.exec()
  }

  /**
   * 通用单个订单查询方法：根据筛选条件查询单个订单
   * @param filter 筛选条件
   */
  private findSingleOrder(filter: FilterQuery<OrderDocument>) {
    return this.orderModel.findOne(filter).exec()
  }

  /**
   * 通用订单更新方法：统一更新逻辑，保证一致性
   * @param filter 筛选条件
   * @param update 更新数据
   * @param returnNewDocument 是否返回更新后的文档（默认 true）
   */
  private updateOrder(
    filter: FilterQuery<OrderDocument>,
    update: UpdateQuery<OrderDocument>,
    returnNewDocument = true,
  ) {
    return this.orderModel.findOneAndUpdate(
      filter,
      update,
      { new: returnNewDocument },
    ).exec()
  }

  /**
   * 根据用户ID查询成功的订单（按结束时间倒序）
   */
  findSuccessOrdersByUserId(userId: string) {
    const filter: FilterQuery<OrderDocument> = { user_id: userId, status: OrderStatus.SUCCESS }
    return this.findOrders(filter, { end_time: -1 })
  }

  /**
   * 根据订单ID删除未支付订单
   */
  deleteUnpaidOrderByOrderId(orderId: string) {
    const filter = this.getUnpaidOrderFilter(orderId)
    return this.orderModel.findOneAndDelete(filter).exec()
  }

  /**
   * 根据订单ID查询成功的订单
   */
  findSuccessOrderById(orderId: string) {
    return this.findSingleOrder({
      order_id: orderId,
      status: OrderStatus.SUCCESS,
    })
  }

  /**
   * 根据订单ID查询任意状态订单
   */
  findOrderById(orderId: string) {
    const filter = { order_id: orderId }
    return this.findSingleOrder(filter)
  }

  /**
   * 创建新订单
   */
  async create(orderData: Partial<Order>) {
    const order = new this.orderModel(orderData)
    return order.save()
  }

  async startSession(): Promise<ClientSession> {
    return await this.orderModel.startSession()
  }

  /**
   * 标记订单为支付成功
   */
  markOrderPaid(orderId: string, extra?: Partial<Order>) {
    const filter = this.getUnpaidOrderFilter(orderId)
    const update: UpdateQuery<OrderDocument> = {
      $set: {
        ...extra,
        status: OrderStatus.SUCCESS,
      },
    }
    return this.updateOrder(filter, update)
  }

  /**
   * 标记订单为关闭状态
   */
  markOrderClosed(orderId: string) {
    const filter = this.getUnpaidOrderFilter(orderId)
    const update: UpdateQuery<OrderDocument> = {
      $set: {
        status: OrderStatus.CLOSED,
        closed_time: new Date(),
      },
    }
    return this.updateOrder(filter, update)
  }

  /**
   * 标记订单为支付失败状态
   */
  markOrderFailed(orderId: string) {
    const filter = this.getUnpaidOrderFilter(orderId)
    const update: UpdateQuery<OrderDocument> = {
      $set: { status: OrderStatus.FAILED },
    }
    return this.updateOrder(filter, update, false)
  }

  /**
   * 抽取未支付订单筛选条件
   */
  private getUnpaidOrderFilter(orderId: string) {
    return { order_id: orderId, status: OrderStatus.NOTPAY } as FilterQuery<OrderDocument>
  }
}
