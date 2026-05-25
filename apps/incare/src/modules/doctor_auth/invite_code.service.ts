import { RedisService } from '@liaoliaots/nestjs-redis'
import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { INVITE_CODE_KEY_PREFIX } from './doctor_auth.constant'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

@Injectable()
export class InviteCodeService {
  private readonly redis: Redis | null
  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow()
  }

  // 生成随机邀请码
  private generateCode(length = 8) {
    let code = ''
    for (let i = 0; i < length; i++) {
      code += CHARS[Math.floor(Math.random() * CHARS.length)]
    }
    return code
  }

  // 创建邀请码
  async createInviteCode() {
    let code: string
    while (true) {
      code = this.generateCode(8)
      const key = `${INVITE_CODE_KEY_PREFIX}:${code}`
      const exists = await this.redis.exists(key)
      if (!exists)
        break
    }
    const key = `${INVITE_CODE_KEY_PREFIX}:${code}`
    await this.redis.set(key, 1)
    return code
  }

  async useInviteCode(code: string): Promise<boolean> {
    const key = `${INVITE_CODE_KEY_PREFIX}:${code}`
    const cached = await this.redis.get(key)

    if (!cached)
      return false
    await this.redis.del(key)
    return cached === '1'
  }
}
