// QRS 检测相关
import { LeadsData } from '../interfaces'
import { smoothSignal } from './pre-processing'
import { findPeakInRaw } from './utils'

export function detectQRSFinal(data: number[], fs: number) {
  const smoothedData = smoothSignal(data, 5)
  const featureSignal = Array.from({ length: smoothedData.length }).fill(0) as number[]
  for (let i = 2; i < smoothedData.length - 2; i++) {
    const slope = (2 * smoothedData[i + 1] + smoothedData[i + 2] - 2 * smoothedData[i - 1] - smoothedData[i - 2]) / 8
    featureSignal[i] = slope * slope
  }
  const windowSize = Math.round(0.08 * fs)
  const integratedSignal = []
  let currentSum = 0
  for (let i = 0; i < featureSignal.length; i++) {
    currentSum += featureSignal[i]
    if (i >= windowSize)
      currentSum -= featureSignal[i - windowSize]
    integratedSignal.push(currentSum)
  }

  const initLen = Math.min(integratedSignal.length, 2 * fs)
  let maxInitVal = 0
  for (let i = 0; i < initLen; i++) {
    if (integratedSignal[i] > maxInitVal)
      maxInitVal = integratedSignal[i]
  }
  if (maxInitVal < 0.0001)
    maxInitVal = 0.0001

  let spki = maxInitVal * 0.25
  let npki = maxInitVal * 0.05
  let threshold = npki + 0.25 * (spki - npki)

  const peaks = []
  const thresholdCurve = Array.from({ length: integratedSignal.length }).fill(0)
  const rrHistory = [fs]
  const getAvgRR = () => {
    let sum = 0
    for (const r of rrHistory) sum += r
    return sum / rrHistory.length
  }

  let lastQRSIndex = 0
  let lastQRSValue = 0
  const refractoryPeriod = Math.round(0.25 * fs)
  const localMaxima = []

  const getTrueRawPeak = (centerIdx) => {
    const searchRange = 25
    let maxRaw = 0
    const start = Math.max(0, centerIdx - searchRange)
    const end = Math.min(data.length - 1, centerIdx + searchRange)
    for (let k = start; k <= end; k++) {
      const v = Math.abs(data[k])
      if (v > maxRaw)
        maxRaw = v
    }
    return maxRaw
  }

  for (let i = 1; i < integratedSignal.length - 1; i++) {
    if (integratedSignal[i] > integratedSignal[i - 1] && integratedSignal[i] > integratedSignal[i + 1]) {
      localMaxima.push(i)
    }
  }

  for (let i = 0; i < localMaxima.length; i++) {
    const idx = localMaxima[i]
    const val = integratedSignal[idx]
    const fillStart = (i > 0) ? localMaxima[i - 1] : 0
    for (let k = fillStart; k <= idx; k++) thresholdCurve[k] = threshold

    const avgRR = getAvgRR()
    const isHighRisk = (idx - lastQRSIndex < 0.6 * avgRR)
    const dynamicThreshold = isHighRisk ? (threshold * 0.5) : threshold

    if (val > dynamicThreshold) {
      const timeSinceLast = idx - lastQRSIndex

      if (timeSinceLast > refractoryPeriod) {
        let isTWave = false

        if (timeSinceLast < 0.36 * fs) {
          const currRaw = getTrueRawPeak(idx)
          const prevRaw = getTrueRawPeak(lastQRSIndex)
          if (currRaw < prevRaw * 0.65) {
            isTWave = true
          }
        }

        if (!isTWave && timeSinceLast < 0.45 * fs) {
          if (lastQRSValue > 0 && val < lastQRSValue * 0.60)
            isTWave = true
        }
        if (!isTWave && timeSinceLast < 0.50 * fs) {
          if (lastQRSValue > 0 && val < lastQRSValue * 0.35)
            isTWave = true
        }

        if (!isTWave) {
          peaks.push(idx)
          if (peaks.length > 1) {
            const rr = idx - peaks[peaks.length - 2]
            if (rr > 0.4 * fs && rr < 1.5 * fs) {
              rrHistory.push(rr)
              if (rrHistory.length > 5)
                rrHistory.shift()
            }
          }
          lastQRSIndex = idx
          lastQRSValue = val
          let effectiveVal = val
          if (effectiveVal > spki * 3)
            effectiveVal = spki * 3
          spki = 0.125 * effectiveVal + 0.875 * spki
          threshold = npki + 0.25 * (spki - npki)
        }
      }
    }
    else {
      npki = 0.125 * val + 0.875 * npki
      threshold = npki + 0.25 * (spki - npki)
    }

    if (idx - lastQRSIndex > 1.2 * avgRR) {
      const searchStart = lastQRSIndex + refractoryPeriod
      const searchEnd = idx
      let maxBackVal = -1
      let maxBackIdx = -1

      for (let j = 0; j < localMaxima.length; j++) {
        const midx = localMaxima[j]
        if (midx >= searchStart && midx < searchEnd) {
          if (integratedSignal[midx] > maxBackVal) {
            maxBackVal = integratedSignal[midx]
            maxBackIdx = midx
          }
        }
      }

      if (maxBackIdx !== -1 && maxBackVal > threshold * 0.35) {
        peaks.push(maxBackIdx)
        peaks.sort((a, b) => a - b)
        lastQRSIndex = maxBackIdx
        lastQRSValue = maxBackVal
        spki = 0.25 * maxBackVal + 0.75 * spki
        threshold = npki + 0.25 * (spki - npki)
      }
    }
  }
  for (let k = localMaxima[localMaxima.length - 1]; k < thresholdCurve.length; k++) thresholdCurve[k] = threshold
  const finalPeaksRaw = peaks.map(p => findPeakInRaw(data, p, fs))
  return { peaks: finalPeaksRaw, energySignal: integratedSignal, thresholdCurve }
}
export function selectBestLeadForDetection(leadsData: LeadsData): keyof LeadsData {
  const leadNames: (keyof LeadsData)[] = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF']
  let bestLead: keyof LeadsData = 'II'
  let maxScore = -1

  leadNames.forEach((name) => {
    const data = leadsData[name]
    let sumEnergy = 0
    let maxEnergy = 0
    const step = 2

    for (let i = 2; i < data.length; i += step) {
      const slope = Math.abs(data[i] - data[i - 2])
      const energy = slope * slope
      sumEnergy += energy
      if (energy > maxEnergy)
        maxEnergy = energy
    }

    const avgEnergy = sumEnergy / (data.length / step)
    const ratio = maxEnergy / (avgEnergy + 0.00001)
    const score = maxEnergy * Math.log(ratio + 1)

    if (score > maxScore) {
      maxScore = score
      bestLead = name
    }
  })

  return bestLead
}
