import { LeadDetail } from './lead-detail'

/** 每个心跳的分析结果 */
export interface BeatResult {
  sampleIndex: number // 样本索引
  time: number // 时间（秒）
  types: string[] // 心跳类型，如 Sinus Tachycardia
  rrInterval: number // RR 间期（秒）
  hr: number // 心率
  leadSpecificStatus: Record<string, any[]> // 每导联的异常标记
  leadDetails: Record<string, LeadDetail> // 每导联的详细数据
  qrsWidth: number // QRS 宽度（ms）
  pEnergy: number // P 波能量
}
