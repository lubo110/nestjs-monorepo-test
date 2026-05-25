export const SMS_REDIS_KEYS = {
  signupCode: (phone: string) => `sms:signup:code:${phone}`,
  signupLock: (phone: string) => `sms:signup:lock:${phone}`,
}

export const SMS_EXPIRE = {
  CODE: 5 * 60, // 5 分钟
  LOCK: 60, // 1 分钟
}

export const CAPTCHA_KEY_PREFIX = 'auth:captcha'
export const CAPTCHA_TTL_SECONDS = 5 * 60

export const LOGIN_FAIL_COUNT_KEY_PREFIX = 'auth:login:fail'
export const LOGIN_FAIL_COUNT_TTL_SECONDS = 30 * 60

export const INVITE_CODE_KEY_PREFIX = 'invite:code'
