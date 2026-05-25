import type Redis from 'ioredis'
import * as crypto from 'node:crypto'
import { DEFAULT_REDIS, RedisService } from '@liaoliaots/nestjs-redis'
import { HttpService } from '@nestjs/axios'
import { Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bull'
import { lastValueFrom } from 'rxjs'

import { DiagnosisService } from '../../diagnosis/diagnosis.service'
import { JOB_NAMES, QUEUE_NAMES } from '../../shared/strings'
import { ThirdPartyContext } from '../../third_parties/third_party.interface'
import { NotificationData } from '../notification.interface'

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATION_THIRD_PARTY)
export class NotificationThirdPartyProcessor {
  private readonly logger = new Logger(NotificationThirdPartyProcessor.name)
  private readonly redis: Redis

  constructor(
    private readonly httpService: HttpService,
    private readonly diagnosisService: DiagnosisService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS)
  }

  @Process(JOB_NAMES.NOTIFICATION_THIRD_PARTY)
  async handleNotification(job: Job<NotificationData>): Promise<void> {
    const { diagnosis_id, third_party_id } = job.data
    const requestId = job.id
    const redisKey = this.getRedisKey(diagnosis_id)

    this.logger.log(
      `[START] req_id=${requestId} diagnosis_id=${diagnosis_id}`,
    )

    const context = await this.getContext(redisKey, requestId, diagnosis_id)
    if (!context)
      return

    try {
      await this.sendNotification({
        requestId,
        diagnosisId: diagnosis_id,
        thirdPartyId: third_party_id,
        context,
      })

      await this.redis.del(redisKey)

      this.logger.log(
        `[SUCCESS] req_id=${requestId} diagnosis_id=${diagnosis_id}`,
      )
    }
    catch (error) {
      const err = this.extractError(error)

      this.logger.error(
        `[FAILED] req_id=${requestId} diagnosis_id=${diagnosis_id} status=${err.status} message=${err.message}`,
      )
      const isFinalFail = job.attemptsMade + 1 >= job.opts.attempts
      if (isFinalFail) {
        await this.redis.del(redisKey)

        this.logger.error(
          `[CLEANUP] final failure, redis deleted | key=${redisKey}`,
        )
      }
      throw error
    }
  }

  // =========================
  // 发送请求
  // =========================

  private async sendNotification(params: {
    requestId: string | number
    diagnosisId: string
    thirdPartyId: string
    context: ThirdPartyContext
  }) {
    const { requestId, diagnosisId, thirdPartyId, context } = params

    const headers = this.buildHeaders(thirdPartyId, context.api_key)

    const payload = await this.diagnosisService.provideThirdPartyECGData(
      diagnosisId,
      true,
    )

    this.logger.log(
      `[REQUEST] req_id=${requestId} url=${context.notify_url}`,
    )

    await lastValueFrom(
      this.httpService.post(
        context.notify_url,
        {
          user_id: context.external_user_id,
          payload,
        },
        {
          headers,
          timeout: 7000,
        },
      ),
    )
  }

  // =========================
  // Redis
  // =========================

  private async getContext(
    key: string,
    requestId: string | number,
    diagnosisId: string,
  ): Promise<ThirdPartyContext | null> {
    const raw = await this.redis.get(key)

    if (!raw) {
      this.logger.error(
        `[MISSING_CONTEXT] req_id=${requestId} diagnosis_id=${diagnosisId}`,
      )
      return null
    }

    return JSON.parse(raw)
  }

  private getRedisKey(diagnosisId: string) {
    return `third_party:${diagnosisId}`
  }

  // =========================
  // 签名
  // =========================

  private buildHeaders(appId: string, secretKey: string) {
    const timestamp = Date.now().toString()
    const nonce = this.generateNonce()

    return {
      'Content-Type': 'application/json',
      'X-AppId': appId,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': this.generateSignature(appId, timestamp, nonce, secretKey),
    }
  }

  private generateSignature(
    appId: string,
    timestamp: string,
    nonce: string,
    secretKey: string,
  ): string {
    const payload = `appId=${appId},timestamp=${timestamp},nonce=${nonce},${secretKey}`

    return crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex')
  }

  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  private extractError(error: any) {
    return {
      message: error?.message,
      status: error?.response?.status,
    }
  }
}
