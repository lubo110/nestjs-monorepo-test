import { BeatResult } from './beat-result'
import { LeadsData } from './leads'
import { EcgReport } from './report'

export interface QRSFeatures {
  width: number
  onset: number
  offset: number
}

export interface ECGInput {
  name: string
  raw_datas: number[]
  index: number
}

export interface ECGAnalyzeResult {
  report: EcgReport
  beatResults: BeatResult[]
  rPeaks: number[]
  leads: LeadsData
  version: string
}
