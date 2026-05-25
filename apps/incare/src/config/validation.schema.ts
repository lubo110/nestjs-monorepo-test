import * as Joi from 'joi'

export const validationSchema = Joi.object({
  // ================= APP =================
  RUN_ENV: Joi.string().valid('dev', 'test', 'prod').required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  SERVER_PORT: Joi.number().default(3001),
  HOSTNAME: Joi.string().required(),

  // ================= DATABASE =================
  MONGO_URI: Joi.string().required(),
  MONGO_DATABASE_NAME: Joi.string().required(),

  // ================= REDIS =================
  REDIS_HOST: Joi.string().allow('').default('redis'),
  REDIS_PORT: Joi.number().default(6379).empty(''),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB_INDEX: Joi.number().default(0),
  REDIS_EXPIRE_TIME: Joi.number().default(86400),

  // ================= AUTH =================
  JWT_SECRET_V1_USER: Joi.string().required(),
  JWT_SECRET_V2_USER: Joi.string().required(),
  JWT_SECRET_DOCTOR_USER: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('90d'),

  // ================= PUSH =================
  JPUSH_APP_KEY: Joi.string().required(),
  JPUSH_MASTER_SECRET: Joi.string().required(),
  APN_KEY: Joi.string().required(),
  APN_KEYID: Joi.string().required(),
  APN_TEAMID: Joi.string().required(),
  APN_BUNDLEID: Joi.string().required(),
  FIREBASE_PROJECT_ID: Joi.string().required(),
  FIREBASE_PRIVATE_KEY: Joi.string().required(),
  FIREBASE_CLIENT_EMAIL: Joi.string().required(),

  // ================= STORAGE =================
  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_PORT: Joi.number().default(9100),
  MINIO_SSL: Joi.boolean().default(true),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),

  GCS_PROJECT_ID: Joi.string().required(),
  GCS_CLIENT_EMAIL: Joi.string().required(),
  GCS_PRIVATE_KEY: Joi.string().required(),
  GCS_STORAGE_MEDIA_BUCKET: Joi.string().required(),

  // ================= PAYMENT =================
  WECHAT_PAY_APP_ID: Joi.string().required(),
  WECHAT_PAY_MCH_ID: Joi.string().required(),
  WECHAT_PAY_PRIVATE_KEY: Joi.string().required(),
  WECHAT_PAY_PLATFORM_PUBLIC_KEY: Joi.string().required(),
  WECHAT_PAY_APIV3KEY: Joi.string().required(),
  WECHAT_PAY_SERIALNO: Joi.string().required(),
  WECHAT_PAY_NOTIFY_URL: Joi.string().required(),

  // ================= SMS =================
  TWILIO_ACCOUNT_SID: Joi.string().required(),
  TWILIO_AUTH_TOKEN: Joi.string().required(),
  ALICLOUD_ACCESS_KEY_ID: Joi.string().required(),
  ALICLOUD_ACCESS_KEY_SECRET: Joi.string().required(),
  ALICLOUD_SMS_TEMPLATE_CODE: Joi.string().required(),
  ALICLOUD_SMS_SIGN_NAME: Joi.string().required(),
  ALICLOUD_SMS_REGION_ID: Joi.string().required(),

  // ================= THIRD PARTY =================
  DINDIN_APP_ID_KEY: Joi.string().required(),
  DINDIN_TIMESTAMP_KEY: Joi.string().required(),
  DINDIN_APP_ID: Joi.string().required(),
  DINDIN_SECRET_KEY: Joi.string().required(),
  DINDIN_THIRD_PARTY_ID: Joi.string().required(),
  DINDIN_API_HOST: Joi.string().required(),
  DINDIN_API_PORT: Joi.number().required(),
  DINDIN_API_BASE_PATH: Joi.string().required(),

  // ================= LICENSE =================
  SCICHART_KEY: Joi.string().required(),
})
