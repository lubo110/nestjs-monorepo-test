/**
 * 医生诊断流程状态
 */
export enum DoctorDiagnosisStatus {

  /**
   * 已申请医生诊断
   * - 用户在 App 端点击「医生诊断」
   * - 等待医生接单或分配
   */
  Requested = 'Requested',

  /**
   * 医生诊断中
   * - 医生已接单
   * - 正在填写诊断报告
   */
  InProgress = 'InProgress',

  /**
   * 医生诊断完成
   * - 医生已提交诊断报告
   * - 报告可供用户查看
   */
  Completed = 'Completed',
}

export enum AgeRange {
  ALL = 'all',
  RANGE_0_18 = '0-18',
  RANGE_19_45 = '19-45',
  RANGE_46_60 = '46-60',
  RANGE_60_PLUS = '60+',
}

export enum RecordQuality {
  GOOD = 'GOOD', // 良好
  NORMAL = 'NORMAL', // 一般
  POOR_RETRY = 'POOR_RETRY', // 伪差大建议重新量测
}
export enum MainRhythm {
  SINUS_RHYTHM = 'SINUS_RHYTHM', // 窦性心律
  SINUS_ARRHYTHMIA = 'SINUS_ARRHYTHMIA', // 窦性心律不齐
  SINUS_BRADY_ARRHYTHMIA = 'SINUS_BRADY_ARRHYTHMIA', // 窦性心动过缓伴不齐
  SINUS_BRADYCARDIA = 'SINUS_BRADYCARDIA', // 窦性心动过缓
  SINUS_TACHYCARDIA = 'SINUS_TACHYCARDIA', // 窦性心动过速
}
