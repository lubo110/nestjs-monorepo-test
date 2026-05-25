import { MainRhythm, RecordQuality } from '../doctor_diagnosis.enum'

/** 心率信息（次/分） */
export interface HeartRate {
  /** 最慢心率 */
  min: number | null
  /** 平均心率 */
  avg: number | null
  /** 最快心率 */
  max: number | null
}

/** 房性早搏相关统计 */
export interface AtrialPrematureBeats {
  /** 房早总数 */
  total: number | null
  /** 成对房早 */
  couplet: number | null
  /** 房早二联律 */
  bigeminy: number | null
  /** 房早三联律 */
  trigeminy: number | null
  /** 房性心动过速次数 */
  atrialTachycardia: number | null
}

/** 室性早搏相关统计 */
export interface VentricularPrematureBeats {
  /** 室早总数 */
  total: number | null
  /** 成对室早 */
  couplet: number | null
  /** 室早二联律 */
  bigeminy: number | null
  /** 室早三联律 */
  trigeminy: number | null
}

/** 室性心动过速 / 室性自主心律 */
export interface VentricularTachycardia {
  /** 室性心动过速（VT）次数 */
  vt: number | null
  /** 室性自主心律次数 */
  idioventricularRhythm: number | null
}

/** 交界性早搏相关统计 */
export interface JunctionalPrematureBeats {
  /** 交界性早搏总数 */
  total: number | null
  /** 二联律 */
  bigeminy: number | null
  /** 三联律 */
  trigeminy: number | null
}

/** 11) 非阵发性 / 阵发性交界性心动过速 */
export interface JunctionalTachycardia {
  /** 非阵发性交界性心动过速次数 */
  nonParoxysmal: number | null
  /** 阵发性交界性心动过速次数 */
  paroxysmal: number | null
}

/* =======================
 * 核心 ECG 报告结构
 * ======================= */

/** 心电图检测报告 */
export interface EcgAnalysisSummary {
  /** 1) 记录质量 */
  recordQuality?: RecordQuality

  /** 2) 主要心律 */
  mainRhythm?: MainRhythm

  /** 3) 总心跳数 */
  totalBeats: number | null

  /** 4/5/6) 心率信息 */
  heartRate: HeartRate

  /** 7) 房性早搏 */
  atrialPrematureBeats: AtrialPrematureBeats

  /** 8) 室性早搏 */
  ventricularPrematureBeats: VentricularPrematureBeats

  /** 9) 室速 / 室性自主心律 */
  ventricularTachycardia: VentricularTachycardia

  /** 10) 交界性早搏 */
  junctionalPrematureBeats: JunctionalPrematureBeats

  /** 11) 非阵发性 / 阵发性交界性心动过速 */
  junctionalTachycardia: JunctionalTachycardia

  /** 12) RR 间期 ≥ 2.5 秒出现次数 */
  rrIntervalOver25s: number

  /** 13) ST-T 改变 */
  stTChange: number
  normal: number
}
