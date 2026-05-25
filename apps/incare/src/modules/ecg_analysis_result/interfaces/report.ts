import { ClassificationCounts } from './classification-counts'

/** 结构化分析报告 */
export interface EcgReport {
  totalBeats: number // 总心跳数
  avgHR: number // 平均心率
  maxHR: number // 最大心率
  minHR: number // 最小心率
  longPause: number
  classificationCounts: ClassificationCounts // 分类统计
}
