import { Platform } from '../../shared/enums/common.enum'

export type PushPlatform
 = | Platform.IOS
   | Platform.ANDROID
   | Platform.MOBILE
   | Platform.HARMONY

interface ApnsConfig {
  /** iOS专属：角标数 */
  badge?: number
  /** iOS专属：声音 */
  sound?: string
  expiry?: number
}
/** 抽离公共属性（所有设备都有的字段） */
export interface PushMessage {
  deviceType: Platform | string
  /** 推送类型 */
  pushType?: string
  /** 设备标识（iOS=deviceToken, Android=jpush:phone/firebase:user_id） */
  userId: string
  /** 手机号 */
  phone: string
  /** 推送标题 */
  title: string
  /** 推送内容 */
  body: string
  /** 自定义透传数据 */
  extras?: Record<string, any>
  apns?: ApnsConfig
}

export interface PushResult {
  data?: {
    result: any
    pushMessage: PushMessage
  }
  message?: string // 成功/失败说明
}
