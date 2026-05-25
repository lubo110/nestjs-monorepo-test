// 生成 ECG 分析 JSON
import { BeatResult, ClassificationCounts, EcgReport } from '../interfaces'

/**
 * 生成 ECG 分析报告 JSON
 * @param rPeaks R 峰索引数组
 * @param beatResults 每个心跳的分类结果
 * @param fs 采样率
 */
export function generateECGReport(
  rPeaks: number[],
  beatResults: BeatResult[],
  fs: number,
): EcgReport {
  let minHR = 999
  let maxHR = 0
  let totalRR = 0
  let longPauseCount = 0
  if (rPeaks.length > 1) {
    for (let i = 1; i < rPeaks.length; i++) {
      const rrSec = (rPeaks[i] - rPeaks[i - 1]) / fs
      totalRR += rrSec
      const hr = Math.round(60 / rrSec)
      if (hr < minHR)
        minHR = hr
      if (hr > maxHR)
        maxHR = hr
      if (rrSec >= 2.5) {
        longPauseCount++
      }
    }
  }
  else {
    minHR = 0
    maxHR = 0
  }
  const avgHR = rPeaks.length > 1 ? Math.round(60 / (totalRR / (rPeaks.length - 1))) : 0
  const counts: ClassificationCounts = { Normal: 0, PVC: 0, PAC: 0, PJC: 0, STChange: 0, Tachycardia: 0 }
  beatResults.forEach((b) => {
    const typeStr = b.types.join('|')

    const hasPVC = typeStr.includes('PVC')
    const hasPAC = typeStr.includes('PAC')
    const hasPJC = typeStr.includes('PJC')
    const hasSTT = typeStr.includes('ST-T')
    const hasTachy = typeStr.includes('Sinus Tachycardia')

    if (hasPVC)
      counts.PVC++
    if (hasPAC)
      counts.PAC++
    if (hasPJC)
      counts.PJC++
    if (hasSTT)
      counts.STChange++
    if (hasTachy)
      counts.Tachycardia++

    // Normal 判定逻辑一眼能看懂
    const isNormal
     = !hasPVC
       && !hasPAC
       && !hasPJC
       && !hasSTT
       && !hasTachy

    if (isNormal)
      counts.Normal++
  })

  return {
    totalBeats: rPeaks.length,
    minHR,
    maxHR,
    avgHR,
    longPause: longPauseCount,
    classificationCounts: counts,
  }
}
