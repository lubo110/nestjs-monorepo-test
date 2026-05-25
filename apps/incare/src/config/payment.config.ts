import { registerAs } from '@nestjs/config'

export default registerAs('payment', () => ({
  wechat: {
    appId: process.env.WECHAT_PAY_APP_ID,
    mchId: process.env.WECHAT_PAY_MCH_ID,
    privateKey: process.env.WECHAT_PAY_PRIVATE_KEY?.replace(/\\n/g, '\n').trim(),
    platformPublicKey: process.env.WECHAT_PAY_PLATFORM_PUBLIC_KEY?.replace(/\\n/g, '\n').trim(),
    apiV3Key: process.env.WECHAT_PAY_APIV3KEY,
    serialNo: process.env.WECHAT_PAY_SERIALNO,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
  },
}))
