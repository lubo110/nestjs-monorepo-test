export enum WaffleRequestStatus {
  SUCCESS = 0,
  PERMISSION_DENIED = 5501,
  OBJECT_NOT_EXISTED = 5401,
  OBJECT_EXISTED = 5402,
  OBJECT_OVER = 5406,
  OBJECT_NOT_ACTIVITY = 5407,
  OBJECT_ACTIVITY = 5408,
  OBJECT_CLOSED = 5409,
  USER_NOT_VERIFIED = 5403,
  PROCESS_FAILED = 5101,
  PARAMS_NOT_EXISTED = 5502,
  AUTH_EXPIRED_TIME = 5601,
  AUTH_EXPIRED_ERROR = 5602,
  AUTH_TIMES = 5603,
  AUTH_ERROR = 5604,
  AUTH_VERIFIED = 5605,
  TYPE_ERROR = 5701,
  ERROR = 5444,
  BAD_REQUEST = 5301,
  PROCESSING = 5111,
  CONFLICT = 5302,
  CAPTCHA_REQUIRED = 5303,
}

export enum SMSMsgType {
  signup = 'signup',
  resetPassword = 'resetPassword',
}

export enum Language {
  EN_US = 'en_us',
  ZH_TW = 'zh_tw',
  ZH_CN = 'zh_cn',
  ZH_MO = 'zh_mo',
  ZH_HK = 'zh_hk',
  ZH_SG = 'zh_sg',
  KO_KR = 'ko_kr',
}

export enum OrderByType {
  ASC = 'asc',
  DESC = 'desc',
}

export enum FileType {
  IMG = 'IMG',
  PDF = 'PDF',
  VIDEO = 'VIDEO',
}

export enum Roles {
  Admin = 'admin',
  Regular = 'regular',
}

export enum Platform {
  HEADER_KEY = 'platform', // 保留 HEADER_KEY
  /**
   * 兼容国际版的老版本app header
   * 后续更新版本需要删除
   */
  MOBILE = 'mobile',
  IOS = 'ios',
  ANDROID = 'android',
  HARMONY = 'hmos',
  WEB = 'web',
  THIRD_PARTY = 'third_party',
}
/**
 * 地区枚举
 * - CN: 中国区
 * - GLOBAL: 全球区
 */
export enum Region {
  /** 中国区 */
  CN = 'cn',
  /** 全球区 */
  GLOBAL = 'global',
}

/**
 * AI训练授权状态枚举
 */
export enum AiTrainingAgreement {
  /**
   * 未确认（用户尚未确认是否同意用于AI训练）
   */
  UNCONFIRMED = 0,
  /**
   * 不同意（用户明确不同意用于AI训练）
   */
  DISAGREED = 1,
  /**
   * 同意（用户明确同意用于AI训练）
   */
  AGREED = 2,
}

export enum PaymentMethod {
  /**
   * 微信
   */
  WECHAT = 1,
  /**
   * 支付宝
   */
  ALIPAY = 2,
}
