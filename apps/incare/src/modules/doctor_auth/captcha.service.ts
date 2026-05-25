import { RedisService } from '@liaoliaots/nestjs-redis'
import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import * as svgCaptcha from 'svg-captcha'
import { v4 as uuidv4 } from 'uuid'
import { CAPTCHA_KEY_PREFIX, CAPTCHA_TTL_SECONDS } from './doctor_auth.constant'

@Injectable()
export class CaptchaService {
  private readonly redis: Redis | null
  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow()
  }

  getRandomVal(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min
  }

  getRandomCol(min: number, max: number) {
    return `rgb(${this.getRandomVal(min, max)}, ${this.getRandomVal(min, max)}, ${this.getRandomVal(min, max)})`
  }

  async generate() {
    const captcha = svgCaptcha.create({
      size: 4,
      noise: 5,
      ignoreChars: '0o1iIl',
      background: this.getRandomCol(200, 240),
      width: 125,
      height: 40,
    })
    const uuid = uuidv4()
    const key = `${CAPTCHA_KEY_PREFIX}:${uuid}`
    await this.redis.set(key, captcha.text, 'EX', CAPTCHA_TTL_SECONDS)
    return {
      captchaId: uuid,
      captcha: captcha.data,
    }
  }

  async verify(uuid: string, code: string) {
    const key = `${CAPTCHA_KEY_PREFIX}:${uuid}`
    const cached = await this.redis.get(key)

    if (!cached)
      return false

    // 一次性验证码
    await this.redis.del(key)

    return cached.toLowerCase() === code.toLowerCase()
  }
}
