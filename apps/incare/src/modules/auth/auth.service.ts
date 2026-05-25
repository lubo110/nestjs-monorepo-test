import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UAParser } from 'ua-parser-js'
import { v4 as uuid } from 'uuid'
import { LoginInfoService } from '../login_info/login_info.service'
import {
  Platform,
  Roles,
  WaffleRequestStatus,
} from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleErrorResponse } from '../shared/interfaces/common.interface'
import { UserService } from '../users/user.service'
import { UserPayload } from './auth.interface'

@Injectable()
export class AuthService {
  private response: WaffleErrorResponse
  logger = new Logger('AuthService')
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
    private readonly loginInfoService: LoginInfoService,
  ) {}

  async validateUser(
    identifier: string,
    pass: string,
    _platform: string,
    deviceToken?: string,
  ): Promise<UserPayload> {
    const user = await this.usersService.getValidUser(identifier)
    if (
      user
      && bcrypt.compareSync(pass, user.password) /* user.password === pass */
    ) {
      if (deviceToken) {
        user.deviceToken = deviceToken
        await user.save()
        this.logger.log(`[validateUser] user phone is ${identifier} device token is updated to ${deviceToken}`)
      }
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        birthday: user.birthday,
        height: user.height,
        weight: user.weight,
        profile_image: user.profile_image,
        country: user.country,
        status: user.verify_phone ? 'verified' : 'not verified',
        ai_training_agreement: user.ai_training_agreement || 0,
      }
    }
    else {
      return null
    }
  }

  async login(user: UserPayload, headers: any) {
    const ua = headers['user-agent']
    const platform = headers[Platform.HEADER_KEY]

    if (!user) {
      return {
        code: WaffleRequestStatus.AUTH_ERROR,
        error: 'Unauthorized User',
      }
    }
    else {
      try {
        const payload = {
          sub: user.id,
          phone: user.phone,
          role: user.role,
          jti: uuid(),
        }
        const access_token = this.jwtService.sign(payload)
        const device_info = UAParser(ua)
        const device_type = platform
        const login_info = {
          user_id: user.id,
          jti: payload.jti,
          device_type,
          os: device_info.os.name ? device_info.os.name : '',
          ua: device_info.ua,
        }
        await this.loginInfoService.handleUserLogin(login_info)
        return {
          code: WaffleRequestStatus.SUCCESS,
          access_token: `Bearer ${access_token}`,
          user_id: user.id,
          role: user.role,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          birthday: user.birthday,
          height: user.height,
          weight: user.weight,
          profile_image: user.profile_image,
          username: user.username,
          country: user.country,
          status: user.status,
          dev_plan: user.ai_training_agreement,
        }
      }
      catch (e) {
        throw new ApiException(
          `PROCESS_FAILED:${e}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
  }

  async verifyPhone(phone: string, code: string): Promise<any> {
    const userToVerify = await this.usersService.findByIdentifier(phone)
    if (userToVerify.verify_phone) {
      return {
        code: WaffleRequestStatus.OBJECT_EXISTED,
        status: 'Already verified',
      }
    }

    if (userToVerify.verification_code === code) {
      userToVerify.verify_phone = true
      await userToVerify.save()
      return {
        code: WaffleRequestStatus.SUCCESS,
        status: 'Verification code has been successfully validated.',
      }
    }
    else {
      return {
        code: WaffleRequestStatus.OBJECT_NOT_EXISTED,
        status: 'Failed to verify',
      }
    }
  }

  async reset_password(
    phone: string,
    code: string,
    new_password: string,
  ): Promise<any> {
    const user = await this.usersService.findByIdentifier(phone)

    if (!user) {
      return {
        code: WaffleRequestStatus.OBJECT_NOT_EXISTED,
        status: 'User does not exist',
      }
    }
    else if (user.verification_code === code) {
      user.password = bcrypt.hashSync(new_password, 10)

      await user.save()

      return {
        code: WaffleRequestStatus.SUCCESS,
        status: 'Password updated',
      }
    }
    else {
      return {
        code: WaffleRequestStatus.AUTH_ERROR,
        status: 'Password failed to update',
      }
    }
  }

  async validateUserJWT(user_id: string, jti: string): Promise<boolean> {
    const login_info = await this.loginInfoService.findUserToken(user_id, jti)
    if (login_info) {
      return true
    }
    return false
  }

  async handleUserLogout(user: any, login_id: string) {
    const responseBody: any = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
    }

    try {
      const { id, role, jti } = user
      // regular
      if (Roles.Regular === role) {
        await this.loginInfoService.removeUserToken(id, jti)
        responseBody.message = 'User successfully logged out'
      }
      // admin
      else {
        if (login_id) {
          await this.loginInfoService.removeUserTokenById(login_id)
          responseBody.message = `User[login_id:${login_id}] successfully logged out`
        }
        else {
          await this.loginInfoService.removeUserToken(id, jti)
          responseBody.message = `User[Admin] successfully logged out`
        }
      }
      return (this.response = responseBody)
    }
    catch (e) {
      throw new ApiException(
        `PROCESS_FAILED:${e}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async verifyPassword(user: any) {
    // data gets returned from {@link AuthService.validateUser}
    return {
      code: WaffleRequestStatus.SUCCESS,
      data: { id: user.id },
      message: 'Password validation successful.',
    }
  }
}
