import { RedisService } from '@liaoliaots/nestjs-redis'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'
import { Subject } from 'rxjs'
import { DashboardEvent } from './events.interface'

const CHANNEL = 'doctor-dashboard-events'
const SUBJECT_REDIS = 'worker'
@Injectable()
export class DoctorDashboardEventBus
implements OnModuleInit, OnModuleDestroy {
  private pub: Redis
  private sub: Redis
  private subject$ = new Subject<DashboardEvent>()

  constructor(private readonly redisService: RedisService) {

  }

  onModuleInit() {
    // 获取 pub / sub 两个独立实例
    this.pub = this.redisService.getOrThrow()
    this.sub = this.redisService.getOrThrow(SUBJECT_REDIS)

    // 订阅频道
    this.sub.subscribe(CHANNEL)
    this.sub.on('message', (_, message) => {
      try {
        const event = JSON.parse(message) as DashboardEvent
        this.subject$.next(event)
      }
      catch (err) {
        console.error('DashboardEventBus parse error', err)
      }
    })
  }

  onModuleDestroy() {
    this.subject$.complete()
    // 可选：手动关闭连接
    this.pub.disconnect()
    this.sub.disconnect()
  }

  /** 发事件（任何实例都可以用） */
  emit(event: DashboardEvent) {
    this.pub.publish(CHANNEL, JSON.stringify(event))
  }

  /** SSE / Service 订阅 */
  onEvent() {
    return this.subject$.asObservable()
  }
}
