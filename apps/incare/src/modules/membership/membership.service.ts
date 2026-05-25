import { WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'
import { ApiException } from '@incare/modules/shared/exceptions/api.exception'
import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as moment from 'moment'
import { ClientSession, Model } from 'mongoose'
import { ProductType } from '../order/order.enum'
import { MembershipSource, MembershipStatus } from './membership.enum'
import { EnsureActiveMembershipOptions } from './membership.interface'
import { Membership, MembershipDocument } from './membership.schema'

/**
 * 会员服务 - 处理会员的查询、校验、创建和延期等核心逻辑
 */
@Injectable()
export class MembershipService {
  constructor(
    @InjectModel(Membership.name, 'sharedConnection')
    private readonly membershipModel: Model<MembershipDocument>,
  ) {}

  /**
   * 获取用户当前有效的会员信息
   * @param userId 用户ID
   * @returns 有效会员信息 | null
   */
  async getActiveMembership(userId: string): Promise<MembershipDocument | null> {
    // 使用 moment 获取当前时间，统一时间处理
    const currentTime = moment().toDate()

    return this.membershipModel
      .findOne({
        user_id: userId,
        start_time: { $lte: currentTime },
        end_time: { $gte: currentTime },
        status: MembershipStatus.ACTIVE,
      })
      .lean<MembershipDocument>()
      .exec()
  }

  /**
   * 通过 userId 检查用户会员是否有效
   * @param userId 用户ID
   * @returns 是否为有效会员
   */
  async isMembershipActive(userId: string) {
  // 1. 获取用户最新的会员记录
    const latestMembership = await this.membershipModel
      .findOne({ user_id: userId })
      .sort({ end_time: -1 }) // 取最新的会员记录
      .lean<MembershipDocument>()
      .exec()

    // 2. 复用核心校验逻辑
    return this.checkMembershipValidity(latestMembership)
  }

  /**
   * 检查会员是否处于有效状态
   * @param membership 会员信息
   * @returns 是否有效
   */
  private checkMembershipValidity(membership: MembershipDocument | null) {
    if (!membership)
      return false

    // 统一使用 moment 进行时间比较
    const now = moment()
    const startTime = moment(membership.start_time)
    const endTime = moment(membership.end_time)

    return (
      membership.status === MembershipStatus.ACTIVE
      && now.isSameOrAfter(startTime) // 现在 >= 开始时间
      && now.isSameOrBefore(endTime) // 现在 <= 结束时间
    )
  }

  /**
   * 校验用户必须拥有有效会员，否则抛出异常
   * @param userId 用户ID
   * @returns 有效会员信息
   * @throws ApiException 会员无效/过期异常
   */
  async assertActive(userId: string): Promise<MembershipDocument> {
    const membership = await this.getActiveMembership(userId)

    if (!this.checkMembershipValidity(membership)) {
      throw new ApiException(
        '心电解读套餐已过期或无效',
        WaffleRequestStatus.AUTH_EXPIRED_TIME,
        HttpStatus.FORBIDDEN,
      )
    }

    return membership
  }

  /**
   * 确保用户拥有有效会员（无则创建，有则延期）
   * @param options 会员创建/延期参数
   * @returns 更新后的会员信息
   */
  async ensureActiveMembership(
    options: EnsureActiveMembershipOptions,
    session?: ClientSession, // 新增：可选接收外部会话
  ): Promise<MembershipDocument> {
    const { userId, productType, sourceId, payTime, source = MembershipSource.ORDER } = options

    const executeTransaction = async (session: ClientSession) => {
      // 1. 查询用户现有会员
      const existingMembership = await this.membershipModel
        .findOne({ user_id: userId })
        .session(session)
        .exec()
      // 2. 计算会员时间
      const { startTime, endTime } = this.calculateMembershipTime(
        existingMembership,
        payTime,
        productType,
      )

      // 3. 创建或更新会员
      if (!existingMembership) {
        return this.createNewMembership({
          userId,
          startTime,
          endTime,
          source,
          sourceId,
          session,
        })
      }

      return this.updateExistingMembership({
        membership: existingMembership,
        startTime,
        endTime,
        source,
        sourceId,
        session,
      })
    }

    // 事务执行封装
    return this.executeWithTransaction(executeTransaction, session)
  }

  /* =========================
   * 私有辅助方法
   * ========================= */

  /**
   * 事务执行封装 - 统一处理事务的开启、提交、回滚
   * @param operation 事务内要执行的操作
   * @returns 操作结果
   */
  private async executeWithTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    externalSession?: ClientSession, // 新增：接收外部会话
  ): Promise<T> {
    // 标记是否是外部会话（外部会话由调用方管理，当前方法不执行 commit/rollback/endSession）
    const isExternalSession = !!externalSession
    // 优先使用外部会话，无则自动创建内部会话
    const session = externalSession || (await this.membershipModel.db.startSession())

    // 仅当使用内部会话时，才开启事务（外部会话已由调用方开启事务）
    if (!isExternalSession) {
      session.startTransaction()
    }

    try {
      const result = await operation(session)
      if (!isExternalSession) {
        await session.commitTransaction()
      }
      return result
    }
    catch (error) {
      if (!isExternalSession) {
        await session.abortTransaction()
      }
      // 增强错误信息
      throw new ApiException(
        `会员操作失败: ${(error as Error).message}`,
        WaffleRequestStatus.ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    finally {
      if (!isExternalSession) {
        session.endSession()
      }
    }
  }

  /**
   * 计算会员的开始和结束时间（全量 moment 实现）
   * @param existingMembership 现有会员信息
   * @param payTime 支付时间
   * @param productType 套餐类型
   * @returns 计算后的开始/结束时间
   */
  private calculateMembershipTime(
    existingMembership: MembershipDocument | null,
    payTime: Date,
    productType: ProductType,
  ): { startTime: Date, endTime: Date } {
    // 统一使用 moment 包装时间
    const payMoment = moment(payTime)
    const membershipEndMoment = existingMembership ? moment(existingMembership.end_time) : null

    // 使用 moment 进行时间比较
    const hasValidMembership = membershipEndMoment && membershipEndMoment.isSameOrAfter(payMoment)

    // 计算开始时间
    const startTimeMoment = hasValidMembership
      ? moment(existingMembership!.start_time)
      : payMoment

    // 计算基础结束时间
    const baseEndTimeMoment = hasValidMembership
      ? membershipEndMoment
      : payMoment

    // 计算最终结束时间
    const endTimeMoment = this.calculateEndTime(baseEndTimeMoment, productType)

    // 转回 Date 对象适配 mongoose 存储
    return {
      startTime: startTimeMoment.toDate(),
      endTime: endTimeMoment.toDate(),
    }
  }

  /**
   * 创建新会员
   */
  private async createNewMembership(params: {
    userId: string
    startTime: Date
    endTime: Date
    source: MembershipSource
    sourceId: string
    session: ClientSession
  }): Promise<MembershipDocument> {
    const { userId, startTime, endTime, source, sourceId, session } = params

    const [newMembership] = await this.membershipModel.create(
      [
        {
          user_id: userId,
          start_time: startTime,
          end_time: endTime,
          source,
          source_id: sourceId,
          status: MembershipStatus.ACTIVE,
        },
      ],
      { session },
    )

    return newMembership
  }

  /**
   * 更新现有会员
   */
  private async updateExistingMembership(params: {
    membership: MembershipDocument
    startTime: Date
    endTime: Date
    source: MembershipSource
    sourceId: string
    session: ClientSession
  }): Promise<MembershipDocument> {
    const { membership, startTime, endTime, source, sourceId, session } = params

    membership.start_time = startTime
    membership.end_time = endTime
    membership.source = source
    membership.source_id = sourceId
    membership.status = MembershipStatus.ACTIVE

    return membership.save({ session })
  }

  /**
   * 根据基础时间和套餐类型计算会员结束时间（纯 moment 实现）
   * @param baseTimeMoment 基础时间（moment 对象）
   * @param productType 套餐类型
   * @returns 计算后的结束时间（moment 对象）
   */
  private calculateEndTime(baseTimeMoment: moment.Moment, productType: ProductType): moment.Moment {
    // 基于传入的 moment 对象进行时间计算（避免重复包装）
    const endTimeMoment = baseTimeMoment.clone() // 克隆避免修改原对象

    switch (productType) {
      case ProductType.MONTH:
        endTimeMoment.add(1, 'month') // 准确加 1 个月
        break
      case ProductType.YEAR:
        endTimeMoment.add(1, 'year') // 准确加 1 年
        break
      default:
        // 使用更具体的错误信息，便于调试
        throw new Error(`不支持的套餐类型: ${productType}，请检查产品类型配置`)
    }

    return endTimeMoment
  }
}
