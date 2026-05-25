import { Controller, Headers, Param, Post, UseInterceptors } from '@nestjs/common'
import { Platform } from '../shared/enums/common.enum'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import { NotificationService } from './notification.service'

@UseInterceptors(LoggerInterceptor)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('/send/prediction/:phone')
  async sendNotification(@Param() params, @Headers(Platform.HEADER_KEY) platform: Platform) {
    return this.notificationService.sendLatestNotificationByPhone(params.phone, platform)
  }
}
