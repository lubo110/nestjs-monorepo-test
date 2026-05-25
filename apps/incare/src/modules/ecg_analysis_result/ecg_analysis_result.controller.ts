import { Controller, Get, Param, UseInterceptors } from '@nestjs/common'
import { Public } from '@incare/modules/shared/decorators/public.decorator'
import { LoggerInterceptor } from '@incare/modules/shared/interceptors/logger.interceptor'
import { ResponseInterceptor } from '@incare/modules/shared/interceptors/response.interceptor'
import { EcgAnalysisResultService } from './ecg_analysis_result.service'

@UseInterceptors(LoggerInterceptor, ResponseInterceptor)
@Controller('ecg-analysis-result')
export class EcgAnalysisResultController {
  constructor(private readonly ecgAnalysisResultService: EcgAnalysisResultService) {}
  @Public()

  @Get('/result/:diagnosis_id')
  getEcgAnalysisResult(@Param('diagnosis_id') diagnosisId: string) {
    return this.ecgAnalysisResultService.getEcgAnalysisResult(diagnosisId)
  }
}
