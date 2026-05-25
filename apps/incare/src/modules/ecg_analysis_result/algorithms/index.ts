import { ECGAnalyzeResult, ECGInput, LeadsData } from '../interfaces'
import { classifyBeatsIntegrated } from './classification'
import { detectQRSFinal, selectBestLeadForDetection } from './detection'
import { removeBaselineWander } from './pre-processing'
import { generateECGReport } from './report'

/**
 * 運行 ECG 全流程 (去基線 + QRS 偵測 + 分類 + 報告生成)
 */
export function analyzeECG(values: ECGInput[]): ECGAnalyzeResult | null {
  try {
    const SAMPLING_RATE = 250
    const version = 'v1.0.0'

    const lead1Raw = values.find(v => v.name === '1' || v.index === 1)?.raw_datas
    const lead3Raw = values.find(v => v.name === '2' || v.index === 2)?.raw_datas
    if (!lead1Raw || !lead3Raw)
      throw new Error('缺少數據')

    const length = Math.min(lead1Raw.length, lead3Raw.length)

    // 計算標準 6 導聯
    const leads: LeadsData = { I: [], II: [], III: [], aVR: [], aVL: [], aVF: [] }
    for (let i = 0; i < length; i++) {
      const v1 = lead1Raw[i]
      const v3 = lead3Raw[i]
      const v2 = v1 + v3
      leads.I.push(v1)
      leads.II.push(v2)
      leads.III.push(v3)
      leads.aVR.push(-(v1 + v2) / 2)
      leads.aVL.push((v1 - v3) / 2)
      leads.aVF.push((v2 + v3) / 2)
    }

    // 去除基線漂移
    const cleanLeads: LeadsData = { I: [], II: [], III: [], aVR: [], aVL: [], aVF: [] }
    Object.keys(leads).forEach((key) => {
      cleanLeads[key as keyof LeadsData] = removeBaselineWander(leads[key as keyof LeadsData])
    })

    // 1️⃣ 智慧導程選擇
    const detectionLeadName = selectBestLeadForDetection(cleanLeads)
    const detectionData = cleanLeads[detectionLeadName]

    // 2️⃣ QRS 偵測 (v52 Logic)
    console.log(`執行 QRS 偵測 (Source: Lead ${detectionLeadName})...`)
    const detectResult = detectQRSFinal(detectionData, SAMPLING_RATE)

    // 3️⃣ 全功能分類 (v54: Adaptive Width Measurement)
    console.log('執行全功能分類 (v54: Adaptive Width Threshold)...')
    const beatResults = classifyBeatsIntegrated(cleanLeads, detectResult.peaks, SAMPLING_RATE)

    // 4️⃣ 報告生成 (JSON)
    const report = generateECGReport(detectResult.peaks, beatResults, SAMPLING_RATE)

    return {
      report,
      beatResults,
      rPeaks: detectResult.peaks,
      leads: cleanLeads,
      version,
    }
  }
  catch (err: any) {
    console.error('ECG Pipeline 錯誤:', err.message)
    return null
  }
}
