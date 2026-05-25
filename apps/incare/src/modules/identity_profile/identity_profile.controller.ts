import { Body, Controller, Post, UseInterceptors } from '@nestjs/common'
import { CurrentUser } from '@incare/modules/shared/decorators/current_user.decorator'
import { LoggerInterceptor } from '@incare/modules/shared/interceptors/logger.interceptor'
import { ResponseInterceptor } from '@incare/modules/shared/interceptors/response.interceptor'
import { CreateIdentityProfileDTO } from './identity_profile.dto'
import { IdentityProfileService } from './identity_profile.service'

@UseInterceptors(LoggerInterceptor, ResponseInterceptor)
@Controller('identity')
export class IdentityProfileController {
  constructor(
    private readonly service: IdentityProfileService,
  ) {}

  /**
   * 完善 / 更新实名信息
   */
  @Post()
  async upsertIdentity(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateIdentityProfileDTO,
  ) {
    return this.service.upsert(userId, dto)
  }
}
