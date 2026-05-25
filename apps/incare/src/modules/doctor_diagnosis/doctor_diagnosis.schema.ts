import type { BeatResult } from '../ecg_analysis_result/interfaces'
import { Platform } from '@incare/modules/shared/enums/common.enum'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, HydratedDocument } from 'mongoose'
import { DoctorDiagnosisStatus } from './doctor_diagnosis.enum'
import { EcgAnalysisSummary } from './types'

export type DoctorDiagnosisDocument = HydratedDocument<DoctorDiagnosis>
/**
 * 医生诊断报告
 * - 与 diagnosis 表一对一或一对多关联（通过 diagnosis_id）
 * - 用于医生对系统诊断结果的人工确认与补充说明
 */
@Schema({
  collection: 'doctor_diagnosis',
  timestamps: {
    createdAt: 'created_time',
    updatedAt: 'updated_time',
  },
})
export class DoctorDiagnosis extends Document {
  /** 原始诊断 ID */
  @Prop({ required: true, index: true, unique: true })
  diagnosis_id: string

  /** 患者用户 ID */
  @Prop({ required: true, index: true })
  user_id: string

  /**
   * 当前处理医生 ID
   * - NotRequested: null
   * - InProgress / Completed: 有值
   */
  @Prop({ index: true })
  doctor_id?: string

  @Prop({ index: true })
  doctor_name?: string

  /** 医生确认 / 修改后的最终 beat 标注（覆盖算法结果） */
  @Prop({ type: [Object] })
  beat_results_override?: BeatResult[]

  /**
   * 诊断状态
   */
  @Prop({
    enum: DoctorDiagnosisStatus,
    required: true,
    index: true,
    default: DoctorDiagnosisStatus.Requested,
    type: String,
  })
  status: DoctorDiagnosisStatus

  @Prop()
  user_name?: string

  @Prop()
  user_phone?: string

  @Prop({
    enum: Platform,
    required: true,
    type: String,
  })
  platform: Platform

  @Prop()
  age?: number

  @Prop()
  gender?: string

  /** 医生接单时间 */
  @Prop()
  accepted_time?: Date

  /** 医生完成时间 */
  @Prop()
  completed_time?: Date

  /** 诊断结论 */
  @Prop()
  conclusion?: string

  /** 医生建议 */
  @Prop()
  recommendation?: string

  @Prop()
  report_pdf_key?: string

  /** 结构化报告 */
  @Prop({ type: Object })
  ecg_analysis_summary?: EcgAnalysisSummary

  @Prop()
  created_time: Date

  @Prop()
  updated_time: Date
}

export const DoctorDiagnosisSchema = SchemaFactory.createForClass(DoctorDiagnosis)

/**
 * 同一诊断 + 医生的唯一索引
 */
DoctorDiagnosisSchema.index({ diagnosis_id: 1, doctor_id: 1 })

/**
 * 医生工作台查询索引
 */
DoctorDiagnosisSchema.index({ doctor_id: 1, status: 1 })
DoctorDiagnosisSchema.index({ doctor_id: 1, completed_time: 1 })
DoctorDiagnosisSchema.index({
  status: 1,
  created_time: -1,
})

// virtual populate
DoctorDiagnosisSchema.virtual('diagnosis', {
  ref: 'Diagnosis', // 这里是 Model 名称，不是 collection
  localField: 'diagnosis_id',
  foreignField: 'diagnosis_id',
  justOne: true, // 一对一
})

// 让 toJSON / toObject 返回 virtual
DoctorDiagnosisSchema.set('toObject', { virtuals: true })
DoctorDiagnosisSchema.set('toJSON', { virtuals: true })
