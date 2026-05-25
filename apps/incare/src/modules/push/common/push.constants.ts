import { Platform } from '@incare/modules/shared/enums/common.enum'
import { PushPlatform } from './push.interface'

export const PUSH_PLATFORM_SET = new Set<PushPlatform>([
  Platform.IOS,
  Platform.ANDROID,
  Platform.MOBILE,
  Platform.HARMONY,
])

export const JPUSH_CHANNEL = 'jpush'
