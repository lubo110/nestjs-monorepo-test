import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Roles, WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { LoginInfo, LoginInfoDocument } from './login_info.schema'

@Injectable()
export class LoginInfoService {
  private response: WaffleResponse
  constructor(
    @InjectModel(LoginInfo.name, 'sharedConnection')
    private readonly loginInfoModel: Model<LoginInfoDocument>,
  ) { }

  async handleUserLogin(info: any) {
    const { user_id, jti, device_type, ua, os } = info
    try {
      // 檢合併刪除同類型jwt token
      await this.loginInfoModel.findOneAndDelete({
        user_id,
        device_type,
      })
      // 重新寫入jwt token
      await this.loginInfoModel.create({
        user_id,
        jti,
        device_type,
        os,
        ua,
      })
    }
    catch (e) {
      throw new ApiException(
        `PROCESS_FAILED:${e}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async create(createLoginInfoDto: Partial<LoginInfo>): Promise<LoginInfo> {
    const createdLoginInfo = new this.loginInfoModel(createLoginInfoDto)
    return await createdLoginInfo.save()
  }

  async getAllUserLoginInfo(user: any) {
    if (user && Roles.Admin === user.role) {
      const loginInfos: LoginInfoDocument[] = await this.loginInfoModel.find(
        {},
      )
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: loginInfos
      })
    }
    else {
      throw new ApiException(
        'Permission denied',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async findUserToken(
    user_id: string,
    jti: string,
  ): Promise<LoginInfoDocument> {
    return await this.loginInfoModel.findOne({ user_id, jti, is_active: true })
  }

  async findUserTokenById(_id: string): Promise<LoginInfoDocument> {
    return await this.loginInfoModel.findById(_id)
  }

  async removeUserToken(user_id: string, jti: string) {
    return await this.loginInfoModel.findOneAndDelete({ user_id, jti })
  }

  async removeUserTokenById(login_info_id?: string) {
    return await this.loginInfoModel.findOneAndDelete({ _id: login_info_id })
  }
}
