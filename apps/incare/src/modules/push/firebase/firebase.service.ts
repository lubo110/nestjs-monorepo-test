import type { app, messaging, ServiceAccount } from 'firebase-admin'
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { pushConfig, PushConfig } from '@incare/config/index'
import { PushMessage, PushResult } from '../common/push.interface'

@Injectable()
export class FirebaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FirebaseService.name)

  private firebaseApp: app.App
  constructor(
    @Inject(pushConfig.KEY)
    private readonly config: PushConfig,

  ) { }

  onModuleInit() {
    this.initFirebaseApp()
  }

  /**
   * 初始化 Firebase 客户端
   */
  private initFirebaseApp() {
    try {
      // 避免重复初始化
      if (admin.apps.length > 0) {
        this.firebaseApp = admin.apps[0]
        this.logger.log('[Firebase][init] reuse existing firebase app')
        return
      }

      const firebase = this.config.firebase

      const serviceAccount: ServiceAccount = {
        projectId: firebase.projectId,
        privateKey: firebase.privateKey,
        clientEmail: firebase.clientEmail,
      }

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://incare-app.firebaseio.com',
      })

      this.logger.log('[Firebase][init] firebase app initialized')
    }
    catch (error) {
      this.logger.error('[Firebase][init] firebase initialization failed', error.stack)
      throw error
    }
  }

  /**
   * 发送 Firebase 推送
   */
  async send(pushMessage: PushMessage): Promise<PushResult> {
    const { userId } = pushMessage

    const message: messaging.Message = {
      data: pushMessage.extras,
      topic: userId,
      android: {
        priority: 'high',
      },
    }

    try {
      const result = await this.firebaseApp
        .messaging()
        .send(message)

      this.logger.log(`[Firebase][send] push success (topic=${userId}, messageId=${result})`)

      return {
        data: {
          result,
          pushMessage,
        },
        message: 'Firebase push success',
      }
    }
    catch (error) {
      this.logger.error(
        `[Firebase][send] push error (topic=${userId}) ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * 销毁 Firebase 客户端
   */
  private async destroy() {
    if (!this.firebaseApp)
      return

    try {
      await this.firebaseApp.delete()
      this.logger.log('[Firebase][destroy] firebase app deleted')
    }
    catch (error) {
      this.logger.error('[Firebase][destroy] firebase destroy failed', error.stack)
    }
  }

  async onModuleDestroy() {
    await this.destroy()
  }
}
