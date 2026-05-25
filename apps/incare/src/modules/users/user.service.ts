import { systemConfig, SystemConfig } from '@incare/config/index'
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'
import mongoose, { Model, ModifyResult } from 'mongoose'
import * as rn from 'random-number'
import { v4 as uuid } from 'uuid'
import { IdentityProfileService } from '../identity_profile/identity_profile.service'
import {
  Language,
  SMSMsgType,
  WaffleRequestStatus,
} from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import SmsService from '../sms/sms.service'
import { UnregisterService } from '../unregister/unregister.service'
import { UpdateAiTrainingAgreementDTO } from './user.dto'
import { User, UserDocument } from './user.schemas'

@Injectable()
export class UserService {
  logger = new Logger('UserService')
  response: WaffleResponse
  constructor(
    @InjectModel(User.name, 'sharedConnection')
    private userModel: Model<UserDocument>,
    private readonly unregisterService: UnregisterService,
    private readonly smsService: SmsService,
    private readonly identityProfileService: IdentityProfileService,
    @Inject(systemConfig.KEY)
    private readonly config: SystemConfig,
  ) { }

  /**
   * Searching user by identifier
   * web: phone number
   * mobile: phone number
   */
  async findByIdentifier(identifier: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone: identifier })
  }

  /**
   * Searching user by user_id
   */
  async findByUserId(user_id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ id: user_id })
  }

  async signup(body: any) {
    const user = await this.findByIdentifier(body.phone)
    const code = rn({
      min: 1000,
      max: 9999,
      integer: true,
    })

    if (!user) {
      const create_user = {
        id: uuid(),
        password: bcrypt.hashSync(body.password, 10),
        phone: body.phone,
        language: body.language || Language.EN_US,
        verify_phone: false,
        verification_code: code,
      }

      // send a verification code to the phone number
      if (this.config.useSms) {
        this.smsService.sendVerificationCodeSms(
          body.phone,
          code,
          create_user.language,
          SMSMsgType.signup,
        )
      }
      this.save(create_user)
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        message: 'User created',
        data: {
          phone: create_user.phone,
          user_id: create_user.id,
        },
      })
    }
    else {
      if (!user.verify_phone) {
        // update user data
        user.verification_code = code
        // reset password
        user.password = bcrypt.hashSync(body.password, 10)
        user.language = body.language || Language.EN_US

        // send a verification code to the phone number
        if (this.config.useSms) {
          this.smsService.sendVerificationCodeSms(
            body.phone,
            code,
            user.language,
            SMSMsgType.signup,
          )
        }
        this.save(user)

        return (this.response = {
          code: WaffleRequestStatus.SUCCESS,
          data: {
            phone: body.phone,
          },
          message: 'Verification code sent. Please check your SMS',
        })
      }
      else {
        // user exists and is verified
        return (this.response = {
          code: WaffleRequestStatus.OBJECT_EXISTED,
          message: 'User already exists.',
          data: {},
        })
      }
    }
  }

  async phone_exist(phone: string): Promise<any> {
    const user = await this.getValidUser(phone)
    if (!user) {
      return (this.response = {
        code: WaffleRequestStatus.OBJECT_NOT_EXISTED,
        message: 'User not found. Please check and try again',
        data: {},
      })
    }
    else {
      // get a verification code
      const code = rn({
        min: 1000,
        max: 9999,
        integer: true,
      })

      // send verification code to the phone number
      if (process.env.NODE_ENV !== 'localhost') {
        this.smsService.sendVerificationCodeSms(
          phone,
          code,
          user.language,
          SMSMsgType.resetPassword,
        )
      }

      // update random number in object
      user.verification_code = code

      await user.save()

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        message: 'Verification code sent. Please check your SMS',
        data: {},
      })
    }
  }

  /**
   * Deletes a user by phone number
   */
  async deleteUserByPhone(phoneNumber: string): Promise<UserDocument | null> {
    try {
      const result: ModifyResult<UserDocument>
        = await this.userModel.findOneAndDelete({ phone: phoneNumber })
      const deletedUser = result?.value ?? null
      return deletedUser
    }
    catch (error) {
      console.error('Error deleting user:', error)
      return null
    }
  }

  async save(user_object: any, session?: mongoose.ClientSession): Promise<any> {
    const model = new this.userModel(user_object)
    if (session) {
      return await model.save({ session })
    }
    else {
      return await model.save()
    }
  }

  /**
   * Get a list of all users by user_ids
   */
  async findUserInfoByUserIds(
    userIds: Array<string>,
  ): Promise<UserDocument[] | null> {
    return this.userModel.find({ id: { $in: userIds } })
  }

  /**
   * Get user_id by phone
   */
  async findUserIdByPhone(phone: string): Promise<WaffleResponse> {
    const user = await this.userModel.findOne({ phone })
    if (!user) {
      return {
        code: WaffleRequestStatus.PROCESS_FAILED,
        data: { phone },
        message: `User not found`,
      }
    }
    return {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        user_id: user.id,
        phone: user.phone,
      },
    }
  }

  async getValidUser(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone, verify_phone: true })
  }

  async updateUser(body: any) {
    const user = await this.getValidUser(body.phone)
    if (user) {
      // 檢查傳入的欄位，只有當欄位存在且不是空字串時才進行更新
      user.email = body.email?.trim() !== '' ? body.email : user.email
      user.gender = body.gender?.trim() !== '' ? body.gender : user.gender
      user.birthday
        = body.birthday?.trim() !== '' ? body.birthday : user.birthday
      user.profile_image
        = body.profile_image?.trim() !== ''
          ? body.profile_image
          : user.profile_image
      user.username
        = body.username?.trim() !== '' ? body.username : user.username
      user.language
        = body.language?.trim() !== '' ? body.language : user.language
      user.height = body.height?.trim() !== '' ? body.height : user.height
      user.weight = body.weight?.trim() !== '' ? body.weight : user.weight
      user.country = body.country?.trim() !== '' ? body.country : user.country
      await user.save()
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        message: 'User updated',
        data: {},
      })
    }
    else {
      return (this.response = {
        code: WaffleRequestStatus.OBJECT_NOT_EXISTED,
        message: 'User not found',
        data: {},
      })
    }
  }

  async deregisterUser(phone: string) {
    try {
      const user = await this.findByIdentifier(phone)
      if (user) {
        const unregisterUser = {
          id: user.id,
          password: user.password,
          phone: user.phone,
          role: user.role,
          email: user.email,
          gender: user.gender,
          birthday: user.birthday,
          username: user.username,
          language: user.language,
          verify_phone: user.verify_phone,
          height: user.height,
          weight: user.weight,
          country: user.country,
          created_time: user.created_at,
        }
        await this.unregisterService.insertUnregister(unregisterUser)
        await this.deleteUserByPhone(phone)
        await this.identityProfileService.deleteByUserId(user.id)
        this.logger.log(
          `Successfully deactivated user account(phone:${phone}).`,
        )
        return {
          code: WaffleRequestStatus.SUCCESS,
          data: {},
          message: `Successfully deleted user account.`,
        }
      }
      else {
        return {
          code: WaffleRequestStatus.OBJECT_NOT_EXISTED,
          data: {},
          message: `User not found!`,
        }
      }
    }
    catch (err) {
      throw new ApiException(
        `PROCESS_FAILED:${err}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async findUserByPhoneInternal(phone: string): Promise<UserDocument> {
    return await this.userModel.findOne({ phone }).exec()
  }

  async updatePassword(
    phone: string,
    current_password: string,
    new_password: string,
  ): Promise<WaffleResponse> {
    const user = await this.getValidUser(phone)
    if (!user) {
      throw new ApiException(
        `User not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }

    const is_password_valid = await bcrypt.compare(
      current_password,
      user.password,
    )
    if (!is_password_valid) {
      throw new ApiException(
        `Current password is incorrect`,
        WaffleRequestStatus.AUTH_ERROR,
        HttpStatus.UNAUTHORIZED,
      )
    }

    if (current_password === new_password) {
      throw new ApiException(
        `New password must be different from current password`,
        WaffleRequestStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
      )
    }

    // update hash password
    const hashed_password = await bcrypt.hash(new_password, 10)
    user.password = hashed_password
    await user.save()

    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `Password updated successfully`,
    })
  }

  async updateUserAiTrainingAgreement(body: UpdateAiTrainingAgreementDTO) {
    try {
      const user = await this.findByUserId(body.user_id)
      if (!user) {
        return {
          code: WaffleRequestStatus.OBJECT_NOT_EXISTED,
          message: 'User not found. Please check and try again',
          data: {},
        }
      }
      user.ai_training_agreement = body.dev_plan
      await user.save()
      return {
        code: WaffleRequestStatus.SUCCESS,
        message: 'updated successfully',
        data: {},
      }
    }
    catch (err) {
      throw new ApiException(
        `PROCESS_FAILED:${err}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
