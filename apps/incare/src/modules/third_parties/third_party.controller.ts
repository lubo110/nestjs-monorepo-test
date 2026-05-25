import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { CreateDiagnosisDTOV2 } from '../diagnosis/diagnosis.dto'
import { ApiKeyGuard } from '../guards/api_key.auth.guard'
import { CreateMeasureDTO } from '../measures/measure.dto'
import { ThirdParty } from '../shared/decorators/third_party.decorator'
import { Platform } from '../shared/enums/common.enum'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import { AiEvaluationDTO, CreateThirdPartyDTO } from './third_party.dto'
import { ThirdPartyService } from './third_party.service'

@Controller('third-party')
export class ThirdPartyController {
  constructor(private readonly thirdPartyService: ThirdPartyService) {}

  @Post('create')
  async createThirdParty(@Body() body: CreateThirdPartyDTO) {
    return this.thirdPartyService.createThirdParty(body)
  }

  @ThirdParty()
  @UseGuards(ApiKeyGuard)
  @Post('login')
  async login(
    @Req() req,
    @Body('third_party_user_id') external_user_id: string,
  ) {
    return this.thirdPartyService.verifyApiKeyAndGenerateToken(
      req.user,
      external_user_id,
      false,
    )
  }

  @ThirdParty()
  @UseGuards(ApiKeyGuard)
  @Post('verify-api-key')
  async verifyApiKeyAndGenerateToken(
    @Req() req,
    @Body('third_party_user_id') external_user_id: string,
  ) {
    return this.thirdPartyService.verifyApiKeyAndGenerateToken(
      req.user,
      external_user_id,
    )
  }

  /**
   * 延长api key 有效期，默认为一年
   */
  @ThirdParty()
  @Post('extend-api-key')
  async extendApiKey(
    @Body('api_key') apiKye: string,
  ) {
    return this.thirdPartyService.extendApiKey(apiKye)
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/diagnoses/ai-evaluation')
  async evaluateAndNotify(
    @Req() req,
    @Headers(Platform.HEADER_KEY) platform = Platform.THIRD_PARTY,
    @Body(new ValidationPipe()) body: AiEvaluationDTO,
  ): Promise<any> {
    return this.thirdPartyService.evaluateAndNotify(
      req.user,
      body.diagnosis_id,
      body.notify_url,
      platform,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/diagnoses/create')
  async createAuthDiagnosis(@Body() body: CreateDiagnosisDTOV2) {
    return this.thirdPartyService.createDiagnosis(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/diagnoses/:diagnosis_id/measures')
  async handleAuthDiagnosisMeasures(
    @Param() params,
    @Body(new ValidationPipe()) body: CreateMeasureDTO,
  ) {
    return this.thirdPartyService.createMeasure(params.diagnosis_id, body)
  }
}
