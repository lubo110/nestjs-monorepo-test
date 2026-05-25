import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { RolesGuard } from '../guards/roles.guard'
import { CreateMeasureDTO } from '../measures/measure.dto'
import { Permissions } from '../shared/decorators/permission.decorator'
import { Public } from '../shared/decorators/public.decorator'
import { Platform } from '../shared/enums/common.enum'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import {
  CountByDeviceIdsDTO,
  CreateDiagnosisDTOV2,
  DeviceIdsDiagnosesQueryDTO,
  QueryDiagnosisCalDTO,
  QueryDiagnosisDTOV2,
  QueryDiagnosisRangeDTOV2,
  QueryDisableDiagnosisDTO,
  UpdateSyntheticParams,
} from './diagnosis.dto'
import { DiagnosisService } from './diagnosis.service'

@Controller()
export class DiagnosisController {
  constructor(private diagnosisService: DiagnosisService) { }

  @UseInterceptors(LoggerInterceptor)
  @Post('/diagnoses')
  handleCreateDiagnosis(
    @Body(new ValidationPipe()) body: CreateDiagnosisDTOV2,
  ) {
    return this.diagnosisService.createDiagnosis(body)
  }

  // 20241209 新版本方法 (JWT 驗證)
  @UseInterceptors(LoggerInterceptor)
  @Post('/diagnoses/auth') // 新增 'auth' 路徑作區分
  async createAuthDiagnosis(@Body() body: CreateDiagnosisDTOV2) {
    return this.diagnosisService.createDiagnosis(body)
  }

  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Post('/diagnoses/dashboard/admin')
  handleGetAllDiagnosisByAdmin(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: QueryDiagnosisDTOV2,
    @Req() req,
  ) {
    return this.diagnosisService.queryDiagnosisByAdmin(body, req.user)
  }

  @Public()
  @Get('/diagnoses/:diagnosis_id')
  handleGetDiagnosis(@Param() params, @Headers(Platform.HEADER_KEY) platform) {
    return this.diagnosisService.getDiagnosis(
      params.diagnosis_id,
      platform === Platform.WEB,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Patch('/diagnoses/:diagnosis_id/enable/:value')
  handleDisableDiagnosis(
    @Param(new ValidationPipe({ transform: true }))
    params: UpdateSyntheticParams,
  ) {
    return this.diagnosisService.disableDiagnosis(
      params.diagnosis_id,
      params.value,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/calendar/user')
  handleDiagnosisCal(@Body(new ValidationPipe()) body: QueryDiagnosisCalDTO) {
    return this.diagnosisService.getDiagnosisCal(body)
  }

  @Post('/diagnoses/:diagnosis_id/measures')
  handleDiagnosisMeasures(
    @Param() params,
    @Body(new ValidationPipe()) body: CreateMeasureDTO,
  ) {
    return this.diagnosisService.createMeasure(params.diagnosis_id, body)
  }

  // 20241209 新版本方法 (JWT 驗證)
  @UseInterceptors(LoggerInterceptor)
  @Post('/diagnoses/auth/:diagnosis_id/measures') // 新增 'auth' 路徑作區分
  async handleAuthDiagnosisMeasures(
    @Param() params,
    @Body(new ValidationPipe()) body: CreateMeasureDTO,
  ) {
    return this.diagnosisService.createMeasure(params.diagnosis_id, body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Get('/diagnoses/:user_id/latest')
  findUserLatestDiagnosis(@Param('user_id') user_id: string) {
    return this.diagnosisService.findUserLatestDiagnosisId(user_id)
  }

  // 20250704 user跟admin 都可以使用
  @UseInterceptors(LoggerInterceptor)
  @Patch('/prediction/:diagnosis_id/delete')
  async removeDiagnosisPrediction(@Param('diagnosis_id') diagnosis_id) {
    return this.diagnosisService.deletePredictionResult(diagnosis_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Public()
  @Post('/diagnoses/range')
  handleGetAllDiagnosisByRange(
    @Body(new ValidationPipe({ transform: true }))
    body: QueryDiagnosisRangeDTOV2,
  ) {
    return this.diagnosisService.queryDiagnosisByRange(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Post('/diagnoses/dashboard/invalid')
  getDisabledDiagnosis(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: QueryDisableDiagnosisDTO,
  ) {
    return this.diagnosisService.getAllDisabledDiagnosis(body)
  }

  /**
   * Delete a diagnosis and all related records
   */
  @UseInterceptors(LoggerInterceptor)
  @Delete('/diagnoses/:diagnosis_id/remove')
  removeDisableDiagnosis(@Param('diagnosis_id') diagnosis_id: string) {
    return this.diagnosisService.removeDisableDiagnosis(diagnosis_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Patch('/diagnoses/:diagnosis_id/:value')
  async modifyDiagnosisSynthetic(
    @Param(new ValidationPipe({ transform: true }))
    params: UpdateSyntheticParams,
  ) {
    return this.diagnosisService.handleUpdateDiagnosis(params.diagnosis_id, {
      synthetic: params.value,
    })
  }

  @Permissions('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(LoggerInterceptor)
  @Post('/diagnoses/device_ids')
  async getDiagnosesByDeviceIds(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: DeviceIdsDiagnosesQueryDTO,
  ) {
    return this.diagnosisService.findByDeviceIds(body)
  }

  @Permissions('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(LoggerInterceptor)
  @Post('/diagnoses/device_ids/count')
  async countByDeviceIds(@Body() body: CountByDeviceIdsDTO) {
    const result = await this.diagnosisService.countDocumentsByDeviceIds(body)
    return result
  }

  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Post('/diagnoses/third-party/:diagnosis_id/ECGData')
  async provideThirdPartyECGData(
    @Param('diagnosis_id') diagnosis_id: string,
  ): Promise<any> {
    return this.diagnosisService.provideThirdPartyECGData(diagnosis_id, true)
  }
}
