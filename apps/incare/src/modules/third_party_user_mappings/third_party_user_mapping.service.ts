import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import mongoose, { Model } from 'mongoose'
import { v4 as uuid } from 'uuid'
import { authConfig, AuthConfig } from '@incare/config/index'
import { LoginInfoService } from '../login_info/login_info.service'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { ThirdPartyService } from '../third_parties/third_party.service'
import { UserService } from '../users/user.service'
import {
  ThirdPartyUserMapping,
  ThirdPartyUserMappingDocument,
} from './third_party_user_mapping.schema'

@Injectable()
export class ThirdPartyUserMappingService {
  private response: WaffleResponse
  constructor(
    @InjectModel(ThirdPartyUserMapping.name, 'sharedConnection')
    private readonly thirdPartyUserMappingModel: Model<ThirdPartyUserMappingDocument>,
    @Inject(forwardRef(() => ThirdPartyService))
    private readonly thirdPartyService: ThirdPartyService,
    private readonly userService: UserService,
    private readonly loginInfoService: LoginInfoService,
    @InjectConnection('sharedConnection')
    private readonly connection: mongoose.Connection,
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY)
    private readonly config: AuthConfig,
  ) { }

  async handleThirdPartyUser(
    third_party: any,
    external_user_id,
  ): Promise<{
    access_token: string
    system_user_id: string
  }> {
    const user_id = await this.getOrCreateSystemUserId(
      third_party.third_party_id,
      third_party.third_party_name,
      external_user_id,
    )
    const user = await this.userService.findByUserId(user_id)
    const payload = {
      sub: user_id,
      phone: user.phone,
      aud: 'inCare_v2',
      role: user.role,
      third_party_id: third_party.third_party_id,
      external_user_id,
      jti: uuid(),
    }

    const expiresIn = this.config.jwt.expiresIn || '90d'
    const access_token = this.jwtService.sign(payload, { expiresIn })

    const login_info_object = {
      user_id: user.id,
      jti: payload.jti,
    }
    await this.loginInfoService.create(login_info_object)

    return {
      access_token,
      system_user_id: user_id,
    }
  }

  private async getOrCreateSystemUserId(
    third_party_id: string,
    third_party_name: string,
    external_user_id: string,
  ): Promise<string> {
    return this.withTransaction(async (session) => {
      // 檢查 external_user_id 是否存在於系統中
      let mapping = await this.thirdPartyUserMappingModel
        .findOne({
          third_party_id,
          external_user_id,
        })
        .session(session)

      if (mapping) {
        // 如果存在，直接返回對應的 system_user_id
        return mapping.internal_user_id
      }

      // 如果不存在，創建新的用戶和映射
      const user_object = {
        id: uuid(),
        username: `${third_party_name}_${external_user_id}`,
        third_party_id,
        verify_phone: true,
      }
      const user = await this.userService.save(user_object, session)

      mapping = new this.thirdPartyUserMappingModel({
        third_party_id,
        external_user_id,
        internal_user_id: user.id,
      })
      await mapping.save({ session })

      return user.id
    })
  }

  private async withTransaction<T>(
    handler: (session: mongoose.ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      const result = await handler(session) // 執行處理邏輯
      await session.commitTransaction()
      return result // 返回結果
    }
    catch (error) {
      await session.abortTransaction() // 回滾
      throw error // 重新拋出異常
    }
    finally {
      session.endSession() // 結束 session
    }
  }
}
