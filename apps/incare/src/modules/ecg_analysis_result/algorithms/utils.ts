export function findPeakInRaw(data: number[], centerIdx: number, fs: number) {
  const lookBack = Math.round(0.12 * fs)
  const lookFwd = Math.round(0.05 * fs)
  const start = Math.max(2, centerIdx - lookBack)
  const end = Math.min(data.length - 3, centerIdx + lookFwd)
  let maxSlopeVal = -1
  let maxSlopeIdx = centerIdx
  for (let i = start; i <= end; i++) {
    const slope = Math.abs(2 * data[i + 1] + data[i + 2] - 2 * data[i - 1] - data[i - 2]) / 8
    if (slope > maxSlopeVal) {
      maxSlopeVal = slope
      maxSlopeIdx = i
    }
  }
  const radius = Math.round(0.04 * fs)
  const localStart = Math.max(0, maxSlopeIdx - radius)
  const localEnd = Math.min(data.length - 1, maxSlopeIdx + radius)
  let maxAbs = -1
  let bestIdx = maxSlopeIdx
  for (let i = localStart; i <= localEnd; i++) {
    if (Math.abs(data[i]) > maxAbs) {
      maxAbs = Math.abs(data[i])
      bestIdx = i
    }
  }
  return bestIdx
}
