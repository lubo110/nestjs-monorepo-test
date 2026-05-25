// 心跳分类算法
import { LeadDetail, LeadsData } from '../interfaces'
import { measurePreQRSEnergy, measureQRSFeatures, measureSTandT } from './features'

export function classifyBeatsIntegrated(leadsData: LeadsData, rPeaks: number[], fs: number) {
  const results = []
  const leadNames = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF']

  let rrSum = 1
  if (rPeaks.length > 1) {
    for (let i = 1; i < rPeaks.length; i++)
      rrSum += (rPeaks[i] - rPeaks[i - 1])
  }
  const globalAvgRR = rPeaks.length > 1 ? rrSum / (rPeaks.length - 1) : fs

  const pEnergies = []
  for (let i = 1; i < rPeaks.length; i++) {
    const rr = rPeaks[i] - rPeaks[i - 1]
    if (rr > 0.9 * globalAvgRR && rr < 1.1 * globalAvgRR) {
      const qrs = measureQRSFeatures(leadsData.II, rPeaks[i], fs, 0.30)
      const pE = measurePreQRSEnergy(leadsData.II, qrs.onset, fs, false)
      pEnergies.push(pE)
    }
  }
  pEnergies.sort((a, b) => a - b)
  let medianPE = pEnergies.length > 0 ? pEnergies[Math.floor(pEnergies.length / 2)] : 0.005
  if (medianPE < 0.003)
    medianPE = 0.003
  // let _prevType = 'Normal'

  for (let i = 0; i < rPeaks.length; i++) {
    const idx = rPeaks[i]
    const types = []
    const currentRR = (i > 0) ? (idx - rPeaks[i - 1]) : globalAvgRR
    const nextRR = (i < rPeaks.length - 1) ? (rPeaks[i + 1] - idx) : globalAvgRR
    const prevPrevRR = (i > 1) ? (rPeaks[i - 1] - rPeaks[i - 2]) : currentRR
    const instantBPM = Math.round(60 / (currentRR / fs))

    let localAvgRR = globalAvgRR
    if (i > 1) {
      let s = 0
      let count = 0
      const lookBack = Math.min(i, 8)
      for (let k = 1; k <= lookBack; k++) {
        if (i - k - 1 >= 0) {
          s += (rPeaks[i - k] - rPeaks[i - k - 1])
          count++
        }
      }
      if (count > 0)
        localAvgRR = s / count
    }

    const rrRatio = currentRR / localAvgRR
    const nextRRRatio = nextRR / localAvgRR

    let isPremature = false
    if (rrRatio < 0.90) {
      if (currentRR < prevPrevRR * 0.95) {
        isPremature = true
      }
    }
    else if (rrRatio < 0.95) {
      if (nextRRRatio > 1.08 && currentRR < prevPrevRR * 0.95) {
        isPremature = true
      }
    }

    const isVeryPremature = rrRatio < 0.70
    const adaptiveThreshold = isPremature ? 0.15 : 0.30
    const qrsFeatures = measureQRSFeatures(leadsData.II, idx, fs, adaptiveThreshold)

    let widthThreshold = 0.11
    if (isPremature) {
      const fullPauseCheck = currentRR + nextRR
      if (fullPauseCheck > 1.9 * localAvgRR) {
        widthThreshold = 0.09
      }
    }
    if (isVeryPremature)
      widthThreshold = Math.min(widthThreshold, 0.09)

    const isWide = qrsFeatures.width > widthThreshold

    let currentType = 'Normal'

    if (isWide) {
      if (isPremature)
        currentType = 'PVC'
      else currentType = 'Normal'
    }
    else {
      const useNarrowWindow = isPremature
      const pEnergy = measurePreQRSEnergy(leadsData.II, qrsFeatures.onset, fs, useNarrowWindow)

      if (isPremature) {
        const threshold = useNarrowWindow ? 0.0025 : medianPE * 0.6
        if (pEnergy > threshold)
          currentType = 'PAC'
        else currentType = 'PJC'
      }
      else {
        if (instantBPM > 100)
          currentType = 'Sinus Tachycardia'
        else currentType = 'Normal'
      }
    }

    if (currentType === 'PAC' && rrRatio > 0.90 && nextRRRatio < 1.05)
      currentType = 'Normal'
    if (currentType !== 'Normal' && currentType !== 'Sinus Tachycardia')
      types.push(currentType)

    // prevType = currentType

    const leadSpecificStatus: Record<string, string[]> = {}
    const details: Record<string, LeadDetail> = {}
    const leadIsBad: Record<string, boolean> = {}
    leadNames.forEach((lead) => {
      // ★ v57: 取得帶有「真實斜率 (stSlope)」的 ST 分析結果
      const res = measureSTandT(leadsData[lead], idx, qrsFeatures.onset, qrsFeatures.offset, fs)
      details[lead] = res
      leadSpecificStatus[lead] = []
      leadIsBad[lead] = false

      let isAbnormal = false

      // ============================================================
      // ★ v57 核心邏輯: 基於形態學 (Morphology) 的 ST 分析
      // 判斷 ST 段是否為「水平或向下傾斜 (Flat or Downsloping)」
      // 早期再極化的良性斜率通常 > 0.045
      // ============================================================
      const isFlatOrDownsloping = res.stSlope < 0.045

      // 1. 缺血型 ST 抬高 (Elevation): 抬高 > 0.15 且形狀水平/向下
      // 或者，極端抬高 > 0.25 (無論形狀)
      if (res.stDev > 0.25 || (res.stDev > 0.15 && isFlatOrDownsloping)) {
        isAbnormal = true
        leadSpecificStatus[lead].push('ST Elevation')
      }

      // 2. 缺血型 ST 壓低 (Depression): 壓低 < -0.10 且形狀水平/向下
      // 或者，極端壓低 < -0.20 (無論形狀)
      if (res.stDev < -0.20 || (res.stDev < -0.10 && isFlatOrDownsloping)) {
        isAbnormal = true
        leadSpecificStatus[lead].push('ST Depression')
      }

      // 3. T波倒置判斷 (保留原狀)
      if (lead !== 'aVR' && res.isConfirmedInverted) {
        isAbnormal = true
        leadSpecificStatus[lead].push('T-Inversion')
      }

      if (isAbnormal)
        leadIsBad[lead] = true
    })

    let infCount = 0
    if (leadIsBad.II)
      infCount++
    if (leadIsBad.III)
      infCount++
    if (leadIsBad.aVF)
      infCount++
    let latCount = 0
    if (leadIsBad.I)
      latCount++
    if (leadIsBad.aVL)
      latCount++

    // 修正標籤名稱以對應更精確的診斷
    if (infCount >= 2)
      types.push('ST-T Change (Inferior)')
    if (latCount >= 2)
      types.push('ST-T Change (Lateral)')

    if (types.length === 0) {
      types.push(currentType === 'Sinus Tachycardia' ? 'Sinus Tachycardia' : 'Normal')
    }

    results.push({
      sampleIndex: idx,
      time: (idx / fs).toFixed(3),
      types,
      leadSpecificStatus,
      rrInterval: (currentRR / fs).toFixed(3),
      leadDetails: details,
      qrsWidth: (qrsFeatures.width * 1000).toFixed(0),
      pEnergy: measurePreQRSEnergy(leadsData.II, qrsFeatures.onset, fs, false).toFixed(5),
      hr: instantBPM,
    })
  }
  return results
}
