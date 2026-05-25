import { CurrentUser } from '@incare/modules/shared/decorators/current_user.decorator'

import { SkipAppGuard } from '@incare/modules/shared/decorators/skip_app_guard.decorator'
import { Platform, WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'
import { LoggerInterceptor } from '@incare/modules/shared/interceptors/logger.interceptor'
import { ResponseInterceptor } from '@incare/modules/shared/interceptors/response.interceptor'
import { JWTPayload } from '@incare/modules/shared/interfaces/common.interface'
import { Body, Controller, Get, Headers, Param, Patch, Post, Sse, UseGuards, UseInterceptors } from '@nestjs/common'
import { JwtPayloadWithDoctor } from '../doctor_auth/doctor_auth.interface'
import { DoctorJwtAuthGuard } from '../doctor_auth/guards/doctor_jwt.auth.guard'
import { DoctorUserService } from '../doctor_users/doctor_user.service'
import { DoctorDashboardService } from './doctor-dashboard.service'
import { DoctorDiagnosisListQueryDTO, SaveDoctorReportDraftDTO, SubmitDoctorReportDTO } from './doctor_diagnosis.dto'
import { DoctorDiagnosisAction, DoctorDiagnosisGuard } from './doctor_diagnosis.guard'
import { DoctorDiagnosisService } from './doctor_diagnosis.service'

@UseInterceptors(LoggerInterceptor, ResponseInterceptor)
@Controller('doctor-diagnoses')
export class DoctorDiagnosisController {
  constructor(
    private readonly service: DoctorDiagnosisService,
    private readonly doctorDashboardService: DoctorDashboardService,
    private readonly doctorUsersService: DoctorUserService,
  ) { }

  /**
   * 分页查询诊断记录列表
   */
  @SkipAppGuard()
  @UseGuards(DoctorJwtAuthGuard)
  @Post('list')
  findDiagnosisList(
    @CurrentUser() doctor: JwtPayloadWithDoctor,
    @Body() queryDto: DoctorDiagnosisListQueryDTO,
  ) {
    return this.service.getDiagnosisList(queryDto, doctor)
  }

  /**
   * 用户申请医生诊断
   */
  @Post(':diagnosis_id/apply')
  async applyDoctorDiagnosis(
    @CurrentUser() user: JWTPayload,
    @Headers(Platform.HEADER_KEY) platform: Platform = Platform.MOBILE,
    @Param('diagnosis_id') diagnosisId: string,
  ) {
    const data = await this.service.applyForDiagnosis(user.id, user.phone, platform, diagnosisId)
    if (data) {
      return {
        code: WaffleRequestStatus.AUTH_VERIFIED,
        data,
        message: '请先完成实名认证或购买套餐再继续！',
      }
    }
    return data
  }

  /**
   * 医生接单
   */
  @SkipAppGuard()
  @Patch(':diagnosis_id/accept')
  @UseGuards(DoctorJwtAuthGuard, DoctorDiagnosisGuard)
  @DoctorDiagnosisAction('accept')
  acceptDoctorDiagnosis(
    @Param('diagnosis_id') diagnosisId: string,
    @CurrentUser() doctor: JwtPayloadWithDoctor,
  ) {
    return this.service.acceptDoctorDiagnosis(diagnosisId, doctor)
  }

  /**
   * 医生取消接诊
   */
  @SkipAppGuard()
  @Patch(':diagnosis_id/cancel')
  @UseGuards(DoctorJwtAuthGuard, DoctorDiagnosisGuard)
  @DoctorDiagnosisAction('update')
  cancelDiagnosis(
    @Param('diagnosis_id') diagnosisId: string,
    @CurrentUser() doctor: JwtPayloadWithDoctor,
  ) {
    return this.service.cancelDiagnosis(diagnosisId, doctor)
  }

  /**
   * 医生提交诊断报告
   */
  @SkipAppGuard()
  @Patch(':diagnosis_id/submit')
  @UseGuards(DoctorJwtAuthGuard, DoctorDiagnosisGuard)
  @DoctorDiagnosisAction('update')
  async submitDiagnosisReport(
    @Param('diagnosis_id') diagnosisId: string,
    @CurrentUser('id') doctorId: string,
    @Body() submitDto: SubmitDoctorReportDTO,
  ) {
    const doctor = await this.doctorUsersService.findByUserId(doctorId)
    return this.service.submitDoctorReport(diagnosisId, doctorId, doctor.signature, submitDto)
  }

  @SkipAppGuard()
  @Patch(':diagnosis_id/draft')
  @UseGuards(DoctorJwtAuthGuard, DoctorDiagnosisGuard)
  @DoctorDiagnosisAction('update')
  saveDiagnosisReportDraft(
    @Param('diagnosis_id') diagnosisId: string,
    @CurrentUser('id') doctorId: string,
    @Body() draftDto: SaveDoctorReportDraftDTO,
  ) {
    return this.service.saveDoctorReportDraft(
      diagnosisId,
      doctorId,
      draftDto,
    )
  }

  /**
   * 工作台
   */
  @SkipAppGuard()
  @Get('dashboard')
  @UseGuards(DoctorJwtAuthGuard)
  getDashboardStats(@CurrentUser('id') doctorId: string) {
    return this.doctorDashboardService.getDashboardStats(doctorId)
  }

  @SkipAppGuard()
  @Sse('dashboard/sse')
  @UseGuards(DoctorJwtAuthGuard)
  dashboardSse(@CurrentUser('id') doctorId: string) {
    return this.doctorDashboardService.getDashboardSSE(doctorId)
  }

  /**
   * 查询诊断详情
   */
  @SkipAppGuard()
  @Get(':diagnosis_id')
  @UseGuards(DoctorJwtAuthGuard, DoctorDiagnosisGuard)
  @DoctorDiagnosisAction('view')
  findDiagnosisDetail(@Param('diagnosis_id') diagnosisId: string) {
    return this.service.getDiagnosisWithActiveECG(diagnosisId)
  }

  @SkipAppGuard()
  @Get(':diagnosis_id/pdf-url')
  @UseGuards(DoctorJwtAuthGuard)
  getDiagnosisPdfUrl(@Param('diagnosis_id') diagnosisId: string) {
    return this.service.getPdfPresignedUrlByDiagnosisId(diagnosisId)
  }
}
