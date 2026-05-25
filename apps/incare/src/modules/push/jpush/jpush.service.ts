import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { JPushAsync, JPushClient } from 'jpush-async'
import { pushConfig, PushConfig } from '@incare/config/index'
import { PushMessage, PushResult } from '../common/push.interface'
/**
 * JPush 推送服务
 * https://github.com/jpush/jpush-api-nodejs-client/blob/master/doc/api.md
 */
@Injectable()
export class JPushService implements OnModuleInit {
  private readonly logger = new Logger(JPushService.name)

  private jpushClient: JPushClient
  constructor(
    @Inject(pushConfig.KEY)
    private readonly config: PushConfig,

  ) { }

  onModuleInit() {
    this.initJPushClient()
  }

  /**
   * 初始化 JPush 客户端
   */
  private initJPushClient(): void {
    try {
      const jpushConfig = this.config.jpush
      this.jpushClient = JPushAsync.buildClient(
        jpushConfig.appKey,
        jpushConfig.masterSecret,
      )

      this.logger.log('[JPush][init] jpush client initialized')
    }
    catch (error) {
      this.logger.error('[JPush][init] jpush initialization failed', error.stack)
      throw error
    }
  }

  /**
   * 发送 JPush 推送
   */
  async send(pushMessage: PushMessage): Promise<PushResult> {
    const { phone } = pushMessage

    try {
      const pushPayload = this.jpushClient
        .push()
        .setPlatform('android')
        .setAudience(JPushAsync.alias(phone))
        .setMessage(
          pushMessage.body,
          pushMessage.title,
          '',
          pushMessage.extras,
        )

      const result = await pushPayload.send()

      this.logger.log(`[JPush][send] push success (alias=${phone}, msgId=${result.msg_id})`)
      return {
        data: {
          result,
          pushMessage,
        },
        message: 'JPush push success',
      }
    }
    catch (error) {
      this.logger.error(
        `[JPush][send] push error (alias=${phone}) ${error.message}`,
        error.stack,
      )
      throw error
    }
  }
}
