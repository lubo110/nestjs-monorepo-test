import { Platform, WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'
import { ApiException } from '@incare/modules/shared/exceptions/api.exception'
import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as moment from 'moment'
import { FilterQuery, Model, UpdateQuery } from 'mongoose'
import { JwtPayloadWithDoctor } from '../doctor_auth/doctor_auth.interface'
import { EcgAnalysisResultService } from '../ecg_analysis_result/ecg_analysis_result.service'
import { IdentityProfileService } from '../identity_profile/identity_profile.service'
import { MembershipService } from '../membership/membership.service'
import { MinioService } from '../storage/minio/minio.service'
import { DoctorDiagnosisListQueryDTO, SaveDoctorReportDraftDTO, SubmitDoctorReportDTO } from './doctor_diagnosis.dto'

import { AgeRange, DoctorDiagnosisStatus } from './doctor_diagnosis.enum'
import { DoctorDiagnosis, DoctorDiagnosisDocument } from './doctor_diagnosis.schema'
import { DoctorDashboardEventBus } from './events/doctor_dashboard.event_bus'
import { DashboardEventType } from './events/events.enum'
import { GenerateReportPdfJob } from './jobs/generate_report_pdf.job'
import { DoctorDiagnosisWithDiagnosis } from './types/doctor_diagnosis'

@Injectable()
export class DoctorDiagnosisService {
  constructor(
    @InjectModel(DoctorDiagnosis.name, 'sharedConnection')
    private readonly model: Model<DoctorDiagnosisDocument>,
    private readonly identityProfileService: IdentityProfileService,
    private readonly membershipService: MembershipService,
    private readonly generateReportPdfJob: GenerateReportPdfJob,
    private readonly dashboardEventBus: DoctorDashboardEventBus,
    private readonly minioService: MinioService,
    private readonly ecgAnalysisResultService: EcgAnalysisResultService,
  ) { }

  /**
   * 申请医生诊断（最终确认入口）
   * 前置条件：
   * 1. 用户已完成实名（IdentityProfile）
   * 2. 用户套餐有效
   */
  async applyForDiagnosis(userId: string, phone: string, platform: Platform, diagnosisId: string) {
    // 判断是否已实名
    const identity = await this.identityProfileService.findByUserId(userId)
    // 判断套餐是否有效
    const membershipActive = await this.membershipService.isMembershipActive(userId)

    if (!identity || !membershipActive) {
      return {
        identity: !!identity,
        membership: membershipActive,
      }
    }

    // 防止重复申请
    const existed = await this.model.findOne({ diagnosis_id: diagnosisId })
    if (existed) {
      throw new ApiException(
        '该记录已申请复核，请不要重复申请！',
        WaffleRequestStatus.CONFLICT,
        HttpStatus.CONFLICT,
      )
    }
    const result = await this.ecgAnalysisResultService.analyzeAndSaveECGResult(diagnosisId)
    const { totalBeats, avgHR, maxHR, minHR, longPause, classificationCounts: beatCounts } = result.algorithm_report
    // 创建诊断记录（此时条件全部满足）
    await this.model.create({
      diagnosis_id: diagnosisId,
      user_id: userId,
      user_phone: phone,
      platform,
      status: DoctorDiagnosisStatus.Requested,
      user_name: identity.real_name,
      gender: identity.gender,
      age: this.getAge(identity.birthday),
      ecg_analysis_summary: {
        recordQuality: '',
        mainRhythm: '',
        totalBeats,
        heartRate: { min: minHR, avg: avgHR, max: maxHR },
        atrialPrematureBeats: { total: beatCounts.PAC, couplet: 0, bigeminy: 0, trigeminy: 0, atrialTachycardia: 0 },
        ventricularPrematureBeats: { total: beatCounts.PVC, couplet: 0, bigeminy: 0, trigeminy: 0 },
        ventricularTachycardia: { vt: 0, idioventricularRhythm: 0 },
        junctionalPrematureBeats: { total: beatCounts.PJC, bigeminy: 0, trigeminy: 0 },
        junctionalTachycardia: { nonParoxysmal: 0, paroxysmal: 0 },
        rrIntervalOver25s: longPause,
        stTChange: beatCounts.STChange,
        normal: beatCounts.Normal,
      },
    })

    this.dashboardEventBus.emit({ type: DashboardEventType.PENDING_CHANGED })
    return null
  }

  private getAge(birthday: string | Date): number {
    if (!birthday)
      return null
    return moment().diff(moment(birthday), 'years')
  }

  /**
   * 医生接诊
   */
  async acceptDoctorDiagnosis(diagnosisId: string, doctor: JwtPayloadWithDoctor) {
    const updated = await this.model.findOneAndUpdate(
      {
        diagnosis_id: diagnosisId,
        status: DoctorDiagnosisStatus.Requested,
      },
      {
        $set: {
          status: DoctorDiagnosisStatus.InProgress,
          doctor_id: doctor.id,
          doctor_name: doctor.user_name,
          accepted_time: new Date(),
        },
      },
      { new: true },
    )

    if (!updated) {
      throw new ApiException(
        '抱歉，已被其他医生接诊，请刷新列表查看最新状态！',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.CONFLICT,
      )
    }
    this.dashboardEventBus.emit({ type: DashboardEventType.PENDING_CHANGED })
    return null
  }

  async cancelDiagnosis(diagnosisId: string, doctor: JwtPayloadWithDoctor) {
    const { id: doctorId } = doctor
    const updated = await this.model.findOneAndUpdate(
      {
        diagnosis_id: diagnosisId,
        doctor_id: doctorId,
        status: DoctorDiagnosisStatus.InProgress,
      },
      {
        $set: {
          status: DoctorDiagnosisStatus.Requested,
        },
        $unset: {
          doctor_id: '',
          doctor_name: '',
          accepted_time: '',
        },
      },
      { new: true },
    )

    if (!updated) {
      throw new ApiException(
        '当前诊断状态已改变，无法取消，请刷新列表查看最新状态。',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.CONFLICT,
      )
    }
    this.dashboardEventBus.emit({ type: DashboardEventType.PENDING_CHANGED })
    return updated
  }

  /**
   * 医生提交诊断报告
   */
  async submitDoctorReport(
    diagnosisId: string,
    doctorId: string,
    signature: string,
    dto: SubmitDoctorReportDTO,
  ) {
    const updateData: UpdateQuery<DoctorDiagnosis> = {
      $set: {
        conclusion: dto.conclusion,
        recommendation: dto.recommendation,
        ecg_analysis_summary: dto.ecg_analysis_summary ?? {},
        beat_results_override: dto.beat_results_override,
        status: DoctorDiagnosisStatus.Completed,
        completed_time: new Date(),
      },
    }

    const updated = await this.model.findOneAndUpdate(
      {
        diagnosis_id: diagnosisId,
        doctor_id: doctorId,
        status: DoctorDiagnosisStatus.InProgress,
      },
      updateData,
      {
        new: true,
        runValidators: true,
        projection: { _id: 0, __v: 0 },
      },
    ).populate({
      path: 'diagnosis',
      select: 'start_time',
      options: { lean: true },
    }).lean<DoctorDiagnosisWithDiagnosis>()

    if (!updated) {
      throw new ApiException(
        '该诊断任务状态已发生变化，请刷新页面后重试',
        WaffleRequestStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
      )
    }
    this.generateReportPdfJob.dispatch(updated, signature)
    this.dashboardEventBus.emit({ type: DashboardEventType.MY_CASE_CHANGED, doctorId })
    return null
  }

  /**
   * 医生保存诊断报告草稿
   */
  async saveDoctorReportDraft(
    diagnosisId: string,
    doctorId: string,
    dto: SaveDoctorReportDraftDTO,
  ) {
    const updateData: UpdateQuery<DoctorDiagnosis> = {
      $set: {
        conclusion: dto.conclusion,
        recommendation: dto.recommendation,
        ecg_analysis_summary: dto.ecg_analysis_summary ?? {},
        beat_results_override: dto.beat_results_override,
      },
    }

    const updated = await this.model.findOneAndUpdate(
      {
        diagnosis_id: diagnosisId,
        doctor_id: doctorId,
        status: DoctorDiagnosisStatus.InProgress,
      },
      updateData,
    ).lean()

    if (!updated) {
      throw new ApiException(
        '未找到可编辑的诊断任务，请刷新后重试',
        WaffleRequestStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
      )
    }

    return null
  }

  async bindPdfFile(
    diagnosisId: string,
    fileKey: string,
  ) {
    const doc = await this.model.findOneAndUpdate(
      { diagnosis_id: diagnosisId },
      { $set: { report_pdf_key: fileKey } },
      {
        new: true,
      },
    ).populate({
      path: 'diagnosis',
      select: 'start_time',
      options: { lean: true },
    }).lean<DoctorDiagnosisWithDiagnosis>()

    if (!doc) {
      throw new ApiException(
        `Doctor Diagnosis not found: ${diagnosisId}`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }
    return doc
  }

  /**
   * 查询诊断记录列表（分页）
   */
  async getDiagnosisList(query: DoctorDiagnosisListQueryDTO, doctor: JwtPayloadWithDoctor) {
    const filter = this.buildFilter(query, doctor.id)

    const page = Math.max(1, query.page)
    const pageSize = Math.max(1, Math.min(1000, query.page_size))
    const skip = (page - 1) * pageSize

    const [list, total] = await Promise.all([
      this.model
        .find(filter)
        .select('-beat_results_override') // 排除字段
        .skip(skip)
        .limit(pageSize)
        .sort({ created_time: -1 }),
      this.model.countDocuments(filter),
    ])

    return {
      diagnoses: list,
      counts: total,
    }
  }

  private buildFilter(query: DoctorDiagnosisListQueryDTO, userId: string): FilterQuery<DoctorDiagnosis> {
    const filter: FilterQuery<DoctorDiagnosis> = {}

    // 诊断状态
    if (query.status) {
      filter.status = query.status

      if (query.status === DoctorDiagnosisStatus.InProgress) {
        filter.doctor_id = userId
      }
    }

    // 患者姓名（模糊查询）
    if (query.user_name) {
      filter.user_name = { $regex: query.user_name, $options: 'i' }
    }

    // 医生姓名（模糊查询）
    if (query.doctor_name) {
      filter.doctor_name = { $regex: query.doctor_name, $options: 'i' }
    }

    // 性别（精准匹配）
    if (query.gender && query.gender !== 'all') {
      filter.gender = query.gender
    }

    // 年龄段
    if (query.age_range && query.age_range !== AgeRange.ALL) {
      switch (query.age_range) {
        case AgeRange.RANGE_0_18:
          filter.age = { $gte: 0, $lte: 18 }
          break
        case AgeRange.RANGE_19_45:
          filter.age = { $gte: 19, $lte: 45 }
          break
        case AgeRange.RANGE_46_60:
          filter.age = { $gte: 46, $lte: 60 }
          break
        case AgeRange.RANGE_60_PLUS:
          filter.age = { $gte: 60 }
          break
      }
    }

    return filter
  }

  /**
   * 查询诊断详情
   */
  async findByDiagnosisId(diagnosisId: string) {
    const record = await this.model.findOne({ diagnosis_id: diagnosisId })
    if (!record) {
      throw new ApiException(
        `诊断记录【${diagnosisId}】不存在`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }
    return record
  }

  async getDiagnosisWithActiveECG(diagnosisId: string) {
  // 查询诊断记录
    const record = await this.findByDiagnosisId(diagnosisId)
    // 查询心电图分析结果（仅 active 数据）
    const ecgResult = await this.ecgAnalysisResultService.getActiveECGAnalysisResult(diagnosisId)
    if (!ecgResult) {
      throw new ApiException(
        `诊断记录【${diagnosisId}】心电图数据缺失！`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }

    const recordObj = record.toObject()
    const hasOverride = Array.isArray(recordObj.beat_results_override) && recordObj.beat_results_override.length > 0
    // 返回诊断记录 + 导联数据
    return {
      ...recordObj,
      beat_results_override: hasOverride
        ? recordObj.beat_results_override
        : ecgResult.algorithm_beat_results,
      leads: ecgResult.leads,
    }
  }

  async getPdfPresignedUrlByDiagnosisId(diagnosisId: string) {
    const record = await this.findByDiagnosisId(diagnosisId)
    return this.minioService.getPresignedUrl(record.report_pdf_key)
  }
}
