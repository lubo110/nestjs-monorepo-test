export interface AiResponse {
  result: number[][]
  start_end_peak: number[]
  retake_measurement: number
  model_name: string
}

export interface DiagnosisProcessorResult {
  status: boolean
  message: string
  result: string[]
  model_name: string
}
