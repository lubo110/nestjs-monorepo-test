// 信号平滑 & 去基线漂移

export function smoothSignal(data: number[], windowSize: number): number[] {
  const smoothed = Array.from({ length: data.length }).fill(0) as number[]
  const halfWin = Math.floor(windowSize / 2)
  for (let i = 0; i < data.length; i++) {
    let sum = 0
    let count = 0
    for (let j = i - halfWin; j <= i + halfWin; j++) {
      if (j >= 0 && j < data.length) {
        sum += data[j]
        count++
      }
    }
    smoothed[i] = sum / count
  }
  return smoothed
}
export function removeBaselineWander(data: number[]): number[] {
  const alpha = 0.987
  const forward = Array.from({ length: data.length }).fill(0) as number[]
  forward[0] = data[0]
  for (let i = 1; i < data.length; i++) {
    forward[i] = alpha * (forward[i - 1] + data[i] - data[i - 1])
  }

  const reversed = [...forward].reverse()
  const backward = Array.from({ length: data.length }).fill(0) as number[]
  backward[0] = reversed[0]
  for (let i = 1; i < data.length; i++) {
    backward[i] = alpha * (backward[i - 1] + reversed[i] - reversed[i - 1])
  }

  return backward.reverse()
}
