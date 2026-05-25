import { DEFAULT_REDIS, RedisService } from '@liaoliaots/nestjs-redis'
import { HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import Redis from 'ioredis'
import * as rn from 'random-number'
import { optimize } from 'svgo'
import { UAParser } from 'ua-parser-js'
import { v4 as uuid } from 'uuid'
import { AliCloudSmsService } from '../alicloud_sms/alicloud_sms.service'
import { DoctorLoginInfoService } from '../doctor_login_info/login_info.service'
import { DoctorUserStatus } from '../doctor_users/doctor_user.schemas'
import { DoctorUserService } from '../doctor_users/doctor_user.service'
import {
  Platform,
  Roles,
  WaffleRequestStatus,
} from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { CaptchaService } from './captcha.service'
import { LOGIN_FAIL_COUNT_KEY_PREFIX, LOGIN_FAIL_COUNT_TTL_SECONDS, SMS_EXPIRE, SMS_REDIS_KEYS } from './doctor_auth.constant'
import { ChangePasswordDTO, SendSmsCodeDTO, SignupDTO } from './doctor_auth.dto'
import { JwtPayloadWithDoctor, UserPayload } from './doctor_auth.interface'

@Injectable()
export class DoctorAuthService {
  logger = new Logger(DoctorAuthService.name)
  private readonly redis: Redis | null
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: DoctorUserService,
    private readonly loginInfoService: DoctorLoginInfoService,
    private readonly aliCloudSmsService: AliCloudSmsService,
    private readonly redisService: RedisService,
    private readonly captchaService: CaptchaService,
  ) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS)
  }

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<UserPayload> {
    const user = await this.usersService.getValidUser(identifier)
    if (
      user
      && bcrypt.compareSync(password, user.password) /* user.password === pass */
    ) {
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        phone: user.phone,
        profile_image: user.profile_image,
        status: user.status,
      }
    }
    return null
  }

  async authenticateUser(
    identifier: string,
    password: string,
    captcha?: string,
    captchaId?: string,
  ) {
    const loginFailKey = `${LOGIN_FAIL_COUNT_KEY_PREFIX}:${identifier}`
    // 获取当前失败次数
    const failedAttempts = Number(await this.redis.get(loginFailKey)) || 0
    const captchaRequired = failedAttempts >= 3
    // 是否需要验证码
    if (captchaRequired) {
      if (!captcha || !captchaId) {
        throw new ApiException(
          '请输入验证码！',
          WaffleRequestStatus.CAPTCHA_REQUIRED,
          HttpStatus.FORBIDDEN,
        )
      }
      const captchaValid = await this.captchaService.verify(captchaId, captcha)
      if (!captchaValid) {
        await this.increaseFail(loginFailKey)
        throw new ApiException(
          '验证码错误或已过期！',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }

    // 校验账号密码
    const user = await this.validateUser(identifier, password)
    if (!user) {
      await this.increaseFail(loginFailKey)
      throw new UnauthorizedException('账号或密码错误，请重新输入！')
    }

    // 登录成功 → 清零失败次数
    await this.clearFail(loginFailKey)

    return user
  }

  private async increaseFail(key: string) {
    await this.redis
      .multi()
      .incr(key)
      .expire(key, LOGIN_FAIL_COUNT_TTL_SECONDS)
      .exec()
  }

  private async clearFail(key: string) {
    await this.redis.del(key)
  }

  async login(user: UserPayload, platform: Platform, ua: string) {
    try {
      const payload = {
        sub: user.id,
        phone: user.phone,
        role: user.role,
        jti: uuid(),
        user_name: user.username,
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
        access_token: `Bearer ${access_token}`,
        user_id: user.id,
        role: user.role,
        phone: user.phone,
        profile_image: user.profile_image,
        username: user.username,
        status: user.status,
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

  // async resetPassword(
  //   doctor: JwtPayloadWithDoctor,
  //   body: ChangePasswordDTO,
  // ) {
  //   const { currentPassword, newPassword } = body
  //   if (doctor.phone !== phone) {
  //     throw new ApiException(
  //       '验证失败，请检查账号信息是否正确',
  //       WaffleRequestStatus.BAD_REQUEST,
  //       HttpStatus.BAD_REQUEST,
  //     )
  //   }
  //   await this.verifySignupCode(phone, code)
  //   const user = await this.usersService.findByPhone(phone)
  //   if (!user) {
  //     throw new ApiException(
  //       `验证失败，请检查账号信息是否正确`,
  //       WaffleRequestStatus.OBJECT_NOT_EXISTED,
  //       HttpStatus.NOT_FOUND,
  //     )
  //   }
  //   user.password = bcrypt.hashSync(newPassword, 10)
  //   await user.save()
  //   this.usersService.changePassword(doctor.phone, currentPassword, newPassword)
  //   return null
  // }

  async changePassword(
    doctor: JwtPayloadWithDoctor,
    body: ChangePasswordDTO,
  ) {
    const { oldPassword, newPassword } = body
    const { phone } = doctor
    await this.usersService.changePassword(phone, oldPassword, newPassword)
    return null
  }

  async validateUserJWT(user_id: string, jti: string): Promise<boolean> {
    const login_info = await this.loginInfoService.findUserToken(user_id, jti)
    return !!login_info
  }

  async handleUserLogout(user: JwtPayloadWithDoctor) {
    try {
      const { id, jti } = user
      await this.loginInfoService.removeUserToken(id, jti)
      return null
    }
    catch (e) {
      throw new ApiException(
        `PROCESS_FAILED:${e}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async signup(body: SignupDTO) {
    const { phone, password, code, username, signature } = body
    const encryptedPwd = await bcrypt.hash(password, 10)
    await this.verifySignupCode(phone, code)
    let optimizedSignature = ''
    if (typeof signature === 'string' && signature.trim().startsWith('<svg') && signature.trim().endsWith('</svg>')) {
      const optimizeResult = optimize(signature, {
        path: 'path-to.svg',
        multipass: true,
      })
      optimizedSignature = optimizeResult.data
    }
    else {
      throw new ApiException(
        '签名格式错误！',
        WaffleRequestStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST,
      )
    }
    const user = await this.usersService.createUser({
      username,
      signature: optimizedSignature,
      id: uuid(),
      phone,
      password: encryptedPwd,
      role: Roles.Regular,
      status: DoctorUserStatus.ACTIVE,
    })
    return { user_id: user.id, phone: user.phone }
  }

  private async verifySignupCode(phone: string, code: string) {
    const codeKey = SMS_REDIS_KEYS.signupCode(phone)
    const redisCode = await this.redis.get(codeKey)

    if (!redisCode || redisCode !== code) {
      throw new ApiException(
        '验证码错误或已过期！',
        WaffleRequestStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST,
      )
    }

    // 验证通过：删除验证码
    await this.redis.del(codeKey)
    return true
  }

  async sendSmsCode(phone: string, body: SendSmsCodeDTO) {
    const lockKey = SMS_REDIS_KEYS.signupLock(phone)
    const codeKey = SMS_REDIS_KEYS.signupCode(phone)

    const locked = await this.redis.get(lockKey)
    if (locked) {
      throw new ApiException(
        '请求过于频繁，请稍后再试！',
        WaffleRequestStatus.BAD_REQUEST,
        HttpStatus.BAD_REQUEST,
      )
    }
    const code = rn({ min: 1000, max: 9999, integer: true })

    await this.redis.set(codeKey, code, 'EX', SMS_EXPIRE.CODE)
    await this.redis.set(lockKey, '1', 'EX', SMS_EXPIRE.LOCK)
    // 发送验证码

    await this.aliCloudSmsService.sendSms(
      phone,
      {
        code,
      },
      body.sms_type,
    )

    return null
  }
}
