import type { BeatResult, EcgReport } from './interfaces'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

import { Document, HydratedDocument } from 'mongoose'

export type EcgAnalysisResultDocument = HydratedDocument<EcgAnalysisResult>
/**
 * 医生诊断报告
 * - 与 diagnosis 表一对一或一对多关联（通过 diagnosis_id）
 * - 用于医生对系统诊断结果的人工确认与补充说明
 */
@Schema({
  collection: 'ecg_analysis_result',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class EcgAnalysisResult extends Document {
  /** 对应诊断 ID */
  @Prop({ required: true, index: true })
  diagnosis_id: string

  /** 算法生成的 beat 结果（只读） */
  @Prop({ type: [Object], default: [] })
  algorithm_beat_results?: BeatResult[]

  /** ECG 原始/处理后的波形数据 */
  @Prop({ type: Object })
  leads?: Record<string, number[]>

  /** 算法生成的结构化分析报告 */
  @Prop({ type: Object, default: {} })
  algorithm_report?: EcgReport

  /** 算法标识 */
  @Prop({ required: true })
  algorithm_version: string

  @Prop({ default: false })
  is_active: boolean
}

export const EcgAnalysisResultSchema = SchemaFactory.createForClass(EcgAnalysisResult)
