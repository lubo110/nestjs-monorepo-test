import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'
import mongoose, { Model } from 'mongoose'
import {
  WaffleRequestStatus,
} from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { DoctorUser, DoctorUserDocument, DoctorUserStatus } from './doctor_user.schemas'

@Injectable()
export class DoctorUserService {
  logger = new Logger('UserService')
  response: WaffleResponse
  constructor(
    @InjectModel(DoctorUser.name, 'sharedConnection')
    private userModel: Model<DoctorUserDocument>,
  ) {}

  async findByPhone(phone: string): Promise<DoctorUserDocument | null> {
    return this.userModel.findOne({ phone })
  }

  /**
   * Searching user by user_id
   */
  async findByUserId(user_id: string): Promise<DoctorUserDocument | null> {
    return this.userModel.findOne({ id: user_id })
  }

  async save(user_object: Partial<DoctorUser>, session?: mongoose.ClientSession) {
    const model = new this.userModel(user_object)
    if (session) {
      return await model.save({ session })
    }
    return await model.save()
  }

  async createUser(data: Omit<DoctorUser, 'language'>) {
    try {
      return await this.userModel.create(data)
    }
    catch (e: any) {
      if (e.code === 11000) {
        throw new ApiException(
          '该手机号已注册，请直接登录',
          WaffleRequestStatus.CONFLICT,
          HttpStatus.CONFLICT,
        )
      }
      throw new ApiException(
        '注册失败，请稍后重试',
        WaffleRequestStatus.ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getValidUser(phone: string): Promise<DoctorUserDocument> {
    return await this.userModel.findOne({ phone, status: DoctorUserStatus.ACTIVE })
      .select('+password')
  }

  async changePassword(
    phone: string,
    currentPassword: string,
    newPassword: string,
  ) {
  // 获取用户
    const user = await this.getValidUser(phone)

    // 如果用户不存在或密码错误，统一提示
    const isPasswordValid = user
      ? await bcrypt.compare(currentPassword, user.password)
      : false

    if (!isPasswordValid) {
    // 统一错误提示，防止信息泄露
      throw new ApiException(
        `登录凭证无效，请检查后重新尝试`,
        WaffleRequestStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST,
      )
    }

    // 新密码不能和旧密码相同
    if (currentPassword === newPassword) {
      throw new ApiException(
        `新密码不能与旧密码相同`,
        WaffleRequestStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
      )
    }

    // 生成新密码哈希并保存
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    return user
  }
}
