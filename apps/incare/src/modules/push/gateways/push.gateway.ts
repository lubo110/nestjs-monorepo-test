import { Logger, OnModuleInit } from '@nestjs/common'
import { PUSH_PLATFORM_SET } from '../common/push.constants'

import { PushMessage, PushPlatform, PushResult } from '../common/push.interface'
import { PushGatewayRegistry } from './push.gateway.registry'

/**
 * 推送网关抽象基类
 */
export abstract class PushGateway implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name)

  protected constructor(protected readonly registry: PushGatewayRegistry) {}
  /**
   * 当前 gateway 能否处理该消息
   */
  abstract canHandle(message: PushMessage): boolean
  /**
   * 推送消息
   * @param message
   */
  abstract send(message: PushMessage): Promise<PushResult>

  validatePushPlatform(platform: string): PushPlatform {
    if (!PUSH_PLATFORM_SET.has(platform as PushPlatform)) {
      throw new Error(`不支持的推送平台: ${platform}`)
    }

    return platform as PushPlatform
  }

  onModuleInit() {
    this.registry.register(this)
  }
}
