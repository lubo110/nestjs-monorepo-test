import { appConfig, AppConfig, pushConfig, PushConfig } from '@incare/config/index'
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Notification, Provider } from '@parse/node-apn'
import { UserService } from '../../users/user.service'
import { PushMessage, PushResult } from '../common/push.interface'

@Injectable()
export class ApnService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApnService.name)

  private apnProvider: Provider

  constructor(
    private readonly userService: UserService,
    @Inject(pushConfig.KEY)
    private readonly config: PushConfig,
    @Inject(appConfig.KEY)
    private readonly appConfig: AppConfig,
  ) { }

  onModuleInit() {
    this.initApnProvider()
  }

  /**
   * 初始化 APN 客户端
   */
  private initApnProvider(): void {
    try {
      const apnConfig = this.config.apn
      const production = this.appConfig.nodeEnv === 'production'
      const key = apnConfig.key.replace(/\\n/g, '\n')

      this.apnProvider = new Provider({
        token: {
          key,
          keyId: apnConfig.keyId,
          teamId: apnConfig.teamId,
        },
        production,
      })

      this.logger.log(`[APN][init] provider initialized (production=${production})`)
    }
    catch (error) {
      this.logger.error('[APN][init] provider initialization failed', error.stack)
      throw error
    }
  }

  /**
   * 发送 iOS 推送
   */
  async send(pushMessage: PushMessage): Promise<PushResult> {
    const { userId } = pushMessage

    const user = await this.userService.findByUserId(userId)

    if (!user) {
      const msg = `[APN][send] user not found (userId=${userId})`
      this.logger.error(msg)
      throw new Error(msg)
    }

    const deviceToken = user.deviceToken

    if (!deviceToken) {
      const msg = `[APN][send] deviceToken missing (userId=${userId})`
      this.logger.warn(msg)
      throw new Error(msg)
    }

    const notification = this.buildNotification(pushMessage)

    try {
      const result = await this.apnProvider.send(notification, deviceToken)

      const successCount = result.sent.length
      const failedCount = result.failed.length

      if (failedCount > 0) {
        const error = result.failed[0].error
        const reason = error?.message || 'unknown'

        const msg = `[APN][send] push failed (userId=${userId}, deviceToken=${deviceToken}, reason=${reason})`

        this.logger.error(msg)

        throw new Error(msg)
      }

      this.logger.log(
        `[APN][send] push success (userId=${userId}, success=${successCount}, failed=${failedCount})`,
      )

      return {
        data: {
          result,
          pushMessage,
        },
        message: 'APN push success',
      }
    }
    catch (error) {
      this.logger.error(
        `[APN][send] push error (userId=${userId}) ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * 构建 APN 通知
   */
  private buildNotification(pushMessage: PushMessage): Notification {
    const notification = new Notification()

    notification.topic = this.config.apn.bundleId
    notification.alert = pushMessage.title
    notification.sound = pushMessage.apns?.sound ?? 'ping.aiff'

    notification.expiry
      = pushMessage.apns?.expiry
        ?? Math.floor(Date.now() / 1000) + 86400

    if (pushMessage.apns?.badge !== undefined) {
      notification.badge = pushMessage.apns.badge
    }

    if (pushMessage.extras) {
      notification.payload = pushMessage.extras
    }

    return notification
  }

  /**
   * 关闭 APN 客户端
   */
  private async destroy() {
    if (!this.apnProvider)
      return

    try {
      await this.apnProvider.shutdown()
      this.logger.log('[APN][destroy] provider shutdown success')
    }
    catch (error) {
      this.logger.error('[APN][destroy] provider shutdown failed', error.stack)
    }
  }

  async onModuleDestroy() {
    await this.destroy()
  }
}
