// 特征测量函数

import { LeadDetail, QRSFeatures } from '../interfaces'

export function measureQRSFeatures(
  data: number[],
  centerIdx: number,
  fs: number,
  heightRatio = 0.15,
): QRSFeatures {
  const searchWin = Math.round(0.14 * fs)
  const maxQRSDurationSamples = Math.round(0.12 * fs)
  const peakVal = data[centerIdx]
  const th = Math.abs(peakVal) * heightRatio

  let crossing = centerIdx
  for (let i = centerIdx; i > Math.max(0, centerIdx - searchWin); i--) {
    if (Math.abs(data[i]) < th) {
      crossing = i
      break
    }
  }

  let offset = centerIdx
  const lookAheadSamples = Math.round(0.05 * fs)
  for (let i = centerIdx; i < Math.min(data.length, centerIdx + searchWin); i++) {
    if (i - centerIdx > maxQRSDurationSamples) {
      offset = i
      break
    }
    if (Math.abs(data[i]) < th) {
      let foundActivity = false
      for (let k = 1; k <= lookAheadSamples; k++) {
        if ((i + k) < data.length && Math.abs(data[i + k]) > th) {
          foundActivity = true
          break
        }
      }
      if (!foundActivity) {
        offset = i
        break
      }
    }
    else { offset = i }
  }

  return { width: (offset - crossing) / fs, onset: crossing, offset }
}

export function measurePreQRSEnergy(
  data: number[],
  onset: number,
  fs: number,
  isNarrow: boolean,
): number {
  const lookBack = isNarrow ? 0.12 : 0.15
  const buffer = isNarrow ? 0.02 : 0.03
  const start = onset - Math.round(lookBack * fs)
  const end = onset - Math.round(buffer * fs)
  if (start < 0)
    return 0

  let sumDiff = 0
  for (let i = start; i < end - 1; i++) sumDiff += Math.abs(data[i + 1] - data[i])
  return sumDiff / (end - start)
}

export function measureSTandT(
  data: number[],
  peakIdx: number,
  onset: number,
  offset: number,
  fs: number,
): LeadDetail {
  const isoStart = onset - Math.round(0.06 * fs)
  const isoEnd = onset - Math.round(0.02 * fs)
  const isoVals = []
  for (let i = isoStart; i <= isoEnd; i++) {
    if (i >= 0 && i < data.length)
      isoVals.push(data[i])
  }
  isoVals.sort((a, b) => a - b)
  const isoLevel = isoVals.length > 0 ? isoVals[Math.floor(isoVals.length / 2)] : 0

  const jPoint = offset

  // 計算 J+60ms 的值 (ST Segment)
  const idx60 = jPoint + Math.round(0.06 * fs)
  const stVal = (idx60 < data.length) ? data[idx60] : 0
  const stDev = stVal - isoLevel

  // 計算 J+20ms 的平均值 (做為斜率計算起點)
  const idx20 = jPoint + Math.round(0.02 * fs)
  const getAvg = (idx) => {
    let s = 0
    let c = 0
    for (let k = idx - 1; k <= idx + 1; k++) {
      if (k < data.length) {
        s += data[k]
        c++
      }
    }
    return c > 0 ? s / c : 0
  }

  // 取得真實方向斜率 (正值為向右上抬升, 負值為向下傾斜)
  const stSlope = stVal - getAvg(idx20)

  // 測量 T 波
  const tStart = jPoint + Math.round(0.08 * fs)
  const tEnd = jPoint + Math.round(0.32 * fs)
  let minVal = 999
  let sumVal = 0
  let count = 0
  for (let i = tStart; i <= tEnd; i++) {
    if (i < data.length) {
      const val = data[i] - isoLevel
      if (val < minVal)
        minVal = val
      sumVal += val
      count++
    }
  }
  const tAmp = minVal
  const tMean = count > 0 ? sumVal / count : 0
  let isInverted = false
  if (tAmp < -0.05 && tMean < -0.02) {
    isInverted = true
  }
  else if (tAmp < -0.12 && tMean < 0.005) {
    isInverted = true
  }

  return {
    stDev,
    stSlope,
    tAmp,
    tMean,
    isConfirmedInverted: isInverted,
  }
}
