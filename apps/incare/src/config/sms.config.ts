import { registerAs } from '@nestjs/config'

export default registerAs('sms', () => ({
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
  aliyun: {
    accessKeyId: process.env.ALICLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALICLOUD_ACCESS_KEY_SECRET,
    templateCode: process.env.ALICLOUD_SMS_TEMPLATE_CODE,
    signName: process.env.ALICLOUD_SMS_SIGN_NAME,
    regionId: process.env.ALICLOUD_SMS_REGION_ID,
  },
}))
