import { HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import Strategy from 'passport-headerapikey'
import { WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'
import { ApiException } from '@incare/modules/shared/exceptions/api.exception'
import { ThirdPartyService } from '../third_parties/third_party.service'

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'headerapikey') {
  private readonly logger = new Logger(ApiKeyStrategy.name)

  constructor(private readonly thirdPartyService: ThirdPartyService) {
    super(
      { header: 'x-api-key', prefix: '' },
      true,
      async (api_key: string, done) => {
        return this.validate(api_key, done)
      },
    )
  }

  private async validate(
    api_key: string,
    done: (error: any, data?: any) => void,
  ): Promise<void> {
    if (!this.validateApiKeyFormat(api_key)) {
      this.logger.warn(`Invalid API Key format: ${api_key}`)
      return done(new UnauthorizedException('Invalid API Key format'))
    }

    const client = await this.thirdPartyService.findOneByApiKey(api_key, true)
    if (!client) {
      this.logger.warn(`Invalid API Key`)
      return done(new UnauthorizedException('Invalid API Key'))
    }

    const currentDate = new Date()
    if (currentDate > client.expiry_date) {
      this.logger.warn(`API Key expired`)
      return done(new ApiException('API Key expired', WaffleRequestStatus.AUTH_EXPIRED_TIME, HttpStatus.UNAUTHORIZED))
    }

    return done(null, client) // 返回找到的用戶資料
  }

  // API Key 格式驗證
  private validateApiKeyFormat(apiKey: string): boolean {
    const apiKeyPattern = /^[A-Z0-9]{64}$/i // API Key 格式是 64 字符的字母數字组合
    return apiKeyPattern.test(apiKey)
  }
}
