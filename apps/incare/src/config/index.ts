import appConfig from './app.config'
import authConfig from './auth.config'
import databaseConfig from './database.config'
import paymentConfig from './payment.config'
import pushConfig from './push.config'
import redisConfig from './redis.config'
import smsConfig from './sms.config'
import storageConfig from './storage.config'
import systemConfig from './system.config'
import thirdConfig from './third.config'
import { validationSchema } from './validation.schema'

export {
  appConfig,
  authConfig,
  databaseConfig,
  paymentConfig,
  pushConfig,
  redisConfig,
  smsConfig,
  storageConfig,
  systemConfig,
  thirdConfig,
  validationSchema,
}
export type AppConfig = ReturnType<typeof appConfig>
export type AuthConfig = ReturnType<typeof authConfig>
export type DatabaseConfig = ReturnType<typeof databaseConfig>
export type PaymentConfig = ReturnType<typeof paymentConfig>
export type PushConfig = ReturnType<typeof pushConfig>
export type RedisConfig = ReturnType<typeof redisConfig>
export type SmsConfig = ReturnType<typeof smsConfig>
export type StorageConfig = ReturnType<typeof storageConfig>
export type SystemConfig = ReturnType<typeof systemConfig>
export type ThirdConfig = ReturnType<typeof thirdConfig>
