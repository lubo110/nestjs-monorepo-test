import { Language } from '../shared/enums/common.enum'

export interface NotificationData {
  platform: string
  user_id: string
  diagnosis_id: string
  measure_time: string
  lang?: Language
  phone?: string
  push_type?: string // 推送類型
  third_party_id?: string // 第三方id
}

// 定義 ECG 預測通知消息
export interface ECGPredictionNotification {
  title: string
  message: string
}
