import { AiResponse, DiagnosisProcessorResult } from './diagnosis_processor.interface'

/**
 * 心率异常检测处理器
 * 功能：根据异常数据数组识别心率相关异常类型，输出检测结果
 * 优化点：消除逻辑冗余，优先判断重新测量标记，避免无用计算
 */
export class DiagnosisProcessor {
  // 常量配置（集中管理，便于维护）
  private static CONFIG = {
  /**
   * VPC（室性早搏）检查的导联索引数组
   * 对应心电图特定导联位置，用于定向分析VPC相关异常波形
   */
    VPC_CHECK_INDEXES: [0, 1, 2],

    /**
     * ST段（ST-D压低/ST-E抬高）检查的导联索引数组
     * 覆盖ST段异常高发导联，用于识别心肌缺血/梗死相关复极异常
     */
    ST_CHECK_INDEXES: [0, 1, 2, 4, 5],

    /**
     * 心律失常（除VPC外其他节律异常）检查的导联索引数组
     * 全导联覆盖设计，用于全面排查各类心律不齐问题
     */
    ARRHYTHMIA_CHECK_INDEXES: [0, 1, 2, 3, 4, 5],

    /**
     * BBB（束支传导阻滞）检查的导联索引数组
     * 全导联覆盖设计，用于完整评估束支传导异常的QRS波群形态
     */
    BBB_CHECK_INDEXES: [0, 1, 2, 3, 4, 5],

    /**
     * 最小有效数据量阈值
     * 用于过滤无效测量（如数据点不足），确保分析结果可靠性的最低数据计数
     */
    MIN_COUNT_THRESHOLD: 10,

    /**
     * BBB异常判定的阈值计数
     * 当检测到符合BBB特征的数据点达到该数值时，触发BBB异常标记
     */
    BBB_COUNT_THRESHOLD: 20,

    /**
     * 心动过速判定阈值（单位：次/分钟）
     * 心率超过该数值时，判定为心动过速
     */
    HR_TACHYCARDIA_THRESHOLD: 100,

    /**
     * 心动过缓判定阈值（单位：次/分钟）
     * 心率低于该数值时，判定为心动过缓
     */
    HR_BRADYCARDIA_THRESHOLD: 60,

    /**
     * 重新测量的标识键名
     * 用于标记需要重新进行心电图测量的场景（如数据无效、异常无法明确判定）
     */
    RETAKE_MEASUREMENT_KEY: 'retake_measurement',
    /**
     *  异常类型编码映射
     */
    ANOMALY_CODES: {
      VPC: 3,
      STE: 2,
      STD: 1,
      ARRHYTHMIA: 4,
    },

    /**
     * 结果提示信息配置
     * 用于返回标准化的用户/系统提示文本
     */
    MESSAGES: {
      SUCCESS: 'Successful', // 操作成功提示
      RETAKE_MEASUREMENT: 'Retake Measurement', // 重新测量提示
      NORMAL: 'Normal', // 检查结果正常提示
    },
  }

  private anomaliesData: number[][]
  private aiResponse: AiResponse
  private finalAnomalies: string[]
  private hr: number
  private modelName: string

  /**
   * 构造函数
   * @param {object} data - ai响应原始数据
   */
  constructor(data: AiResponse, hr: number) {
    this.anomaliesData = data?.result || []
    this.aiResponse = data
    this.finalAnomalies = []
    this.hr = hr
    this.modelName = data?.model_name || ''
  }

  /**
   * 核心执行方法
   * @returns 检测结果
   */
  execute(): DiagnosisProcessorResult {
    if (!this.aiResponse) {
      return { status: false, message: 'ai response is empty', result: [], model_name: this.modelName }
    }
    const { MESSAGES } = DiagnosisProcessor.CONFIG
    // 1. 第一步：优先检查重新测量标记
    if (this.shouldRetakeMeasurement()) {
      this.finalAnomalies = [MESSAGES.RETAKE_MEASUREMENT]
    }
    else {
      // 2. 第二步：不触发重新测量时，才执行基础异常检测
      if (this.anomaliesData.length > 0) {
        this.detectAllAnomalies()
        this.handleNoAnomaliesCase() // 无任何基础异常时标记正常
      }
      else {
        // 无常数据时，标记为重新测量
        this.finalAnomalies = [MESSAGES.RETAKE_MEASUREMENT]
      }
    }
    return this.formatResult()
  }

  /**
   * 检查是否需要重新测量
   * @returns {boolean} 是否需要重新测量
   */
  shouldRetakeMeasurement(): boolean {
    const { RETAKE_MEASUREMENT_KEY } = DiagnosisProcessor.CONFIG
    return this.aiResponse?.[RETAKE_MEASUREMENT_KEY] === 1
  }

  /**
   * 检测所有基础异常类型（VPC/ST-E/ST-D/BBB/心律失常/心率）
   */
  detectAllAnomalies() {
    const hasBBB = this.detectBBB()
    if (!hasBBB) {
      this.detectVPC()
      this.detectSTE()
      this.detectSTD()
    }

    this.detectArrhythmiaAndHeartRate()
  }

  /**
   * 检测VPC（室性早搏）异常
   */
  detectVPC() {
    const { VPC_CHECK_INDEXES, ANOMALY_CODES } = DiagnosisProcessor.CONFIG
    const hasVpc = this.hasAnomalyInIndexes(VPC_CHECK_INDEXES, ANOMALY_CODES.VPC)

    if (hasVpc) {
      this.finalAnomalies.push('VPC')
    }
  }

  /**
   * 检测ST-E（ST段抬高）异常
   */
  detectSTE() {
    const { ST_CHECK_INDEXES, MIN_COUNT_THRESHOLD, ANOMALY_CODES } = DiagnosisProcessor.CONFIG
    const hasSTE = this.hasAnomalyInIndexes(ST_CHECK_INDEXES, ANOMALY_CODES.STE)

    if (hasSTE) {
      const count1 = this.countMatchingAnomalies(
        this.getAnomaliesDataByIndex(0),
        this.getAnomaliesDataByIndex(4),
        ANOMALY_CODES.STE,
      )
      const count2 = this.countSTCombinationAnomalies(ANOMALY_CODES.STE)

      if (count1 >= MIN_COUNT_THRESHOLD)
        this.finalAnomalies.push('ST-E')
      if (count2 >= MIN_COUNT_THRESHOLD)
        this.finalAnomalies.push('ST-E')
    }
  }

  /**
   * 检测ST-D（ST段压低）异常
   */
  detectSTD() {
    const { ST_CHECK_INDEXES, MIN_COUNT_THRESHOLD, ANOMALY_CODES } = DiagnosisProcessor.CONFIG
    const hasSTD = this.hasAnomalyInIndexes(ST_CHECK_INDEXES, ANOMALY_CODES.STD)

    if (hasSTD) {
      const count1 = this.countMatchingAnomalies(
        this.getAnomaliesDataByIndex(0),
        this.getAnomaliesDataByIndex(4),
        ANOMALY_CODES.STD,
      )
      const count2 = this.countSTCombinationAnomalies(ANOMALY_CODES.STD)

      // 两个计数组独立判断
      if (count1 >= MIN_COUNT_THRESHOLD)
        this.finalAnomalies.push('ST-D')
      if (count2 >= MIN_COUNT_THRESHOLD)
        this.finalAnomalies.push('ST-D')
    }
  }

  /**
   * 检测心律失常和心率异常
   */
  detectArrhythmiaAndHeartRate() {
    const { ARRHYTHMIA_CHECK_INDEXES, HR_TACHYCARDIA_THRESHOLD, HR_BRADYCARDIA_THRESHOLD, ANOMALY_CODES } = DiagnosisProcessor.CONFIG
    const hasArrhythmia = this.hasAnomalyInIndexes(ARRHYTHMIA_CHECK_INDEXES, ANOMALY_CODES.ARRHYTHMIA)

    if (hasArrhythmia) {
      this.finalAnomalies.push('Arrhythmia')
    }
    else {
      // 无心律失常时检查心率范围
      if (this.hr > HR_TACHYCARDIA_THRESHOLD)
        this.finalAnomalies.push('TC')
      if (this.hr < HR_BRADYCARDIA_THRESHOLD)
        this.finalAnomalies.push('BC')
    }
  }

  detectBBB() {
    const { BBB_CHECK_INDEXES, BBB_COUNT_THRESHOLD, ANOMALY_CODES } = DiagnosisProcessor.CONFIG
    const hasBBB = BBB_CHECK_INDEXES.some((index) => {
      const subArr = this.getAnomaliesDataByIndex(index)
      return subArr.filter(item => item === ANOMALY_CODES.VPC).length >= BBB_COUNT_THRESHOLD
    })

    if (hasBBB) {
      this.finalAnomalies.push('BBB')
    }
    return hasBBB
  }

  /**
   * 处理无任何基础异常的情况
   */
  handleNoAnomaliesCase() {
    const { MESSAGES } = DiagnosisProcessor.CONFIG
    if (this.finalAnomalies.length === 0) {
      this.finalAnomalies.push(MESSAGES.NORMAL)
    }
  }

  /**
   * 格式化最终结果
   * @returns  格式化后的结果
   */
  formatResult() {
    const { MESSAGES } = DiagnosisProcessor.CONFIG
    const uniqueAnomalies = [...new Set(this.finalAnomalies)]

    return {
      status: true,
      result: uniqueAnomalies,
      model_name: this.modelName,
      message: MESSAGES.SUCCESS,
    }
  }

  /**
   * 检查指定索引的子数组中是否包含目标异常码
   * @param {Array<number>} indexes - 要检查的子数组索引
   * @param {number} targetCode - 目标异常码
   * @returns {boolean} 是否包含
   */
  hasAnomalyInIndexes(indexes: Array<number>, targetCode: number): boolean {
    return indexes.some((index) => {
      const subArr = this.getAnomaliesDataByIndex(index)
      return subArr.includes(targetCode)
    })
  }

  /**
   * 统计两个子数组中对应位置都为目标异常码的数量（
   * @param {Array<number>} arr1 - 第一个子数组
   * @param {Array<number>} arr2 - 第二个子数组
   * @param {number} targetCode - 目标异常码
   * @returns {number} 匹配数量
   */
  countMatchingAnomalies(arr1: number[], arr2: number[], targetCode: number): number {
    let count = 0
    const maxLength = Math.max(arr1.length, arr2.length)
    for (let i = 0; i < maxLength; i++) {
      if (arr1[i] === targetCode && arr2[i] === targetCode) {
        count++
      }
    }
    return count
  }

  /**
   * 统计ST段异常的组合匹配数量
   * @param {number} targetCode - 目标异常码
   * @returns {number} 匹配数量
   */
  countSTCombinationAnomalies(targetCode: number): number {
    let count = 0
    const arr1 = this.getAnomaliesDataByIndex(1)
    const arr2 = this.getAnomaliesDataByIndex(2)
    const arr5 = this.getAnomaliesDataByIndex(5)

    for (let i = 0; i < arr1.length && i < arr5.length; i++) {
      const cond1 = arr2[i] === targetCode && arr5[i] === targetCode
      const cond2 = arr1[i] === targetCode && arr2[i] === targetCode
      const cond3 = arr1[i] === targetCode && arr5[i] === targetCode

      if (cond1 || cond2 || cond3) {
        count++
      }
    }
    return count
  }

  /**
   * 安全获取子数组（避免索引越界）
   * @param index 索引
   * @returns 数组
   */
  getAnomaliesDataByIndex(index: number) {
    return Array.isArray(this.anomaliesData[index]) ? this.anomaliesData[index] : []
  }
}
