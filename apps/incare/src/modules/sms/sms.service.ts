import { Injectable } from '@nestjs/common'
import { parsePhoneNumber } from 'libphonenumber-js'
import { AliCloudSmsService } from '../alicloud_sms/alicloud_sms.service'
import { SMSTranslateMsg } from '../shared/common.response'
import { Language, SMSMsgType } from '../shared/enums/common.enum'
import TwilioService from './twilio.service'

@Injectable()
export default class SmsService {
  private readonly template_ids: { [key in SMSMsgType]: string }

  constructor(
    private readonly aliCloudSmsService: AliCloudSmsService,
    private readonly twilioService: TwilioService,
  ) {
    // 初始化templateIds
    this.template_ids = {
      [SMSMsgType.signup]: 'SMS_464115133',
      [SMSMsgType.resetPassword]: 'SMS_464105139',
    }
  }

  private getVerificationMsg(language: string, msgType: SMSMsgType): string {
    const lang = SMSTranslateMsg[language] ? language : Language.EN_US
    return SMSTranslateMsg[lang][msgType]
  }

  public getCountryCodeFromPhoneNumber(phone: string): string {
    const phoneNumber = parsePhoneNumber(phone)
    return phoneNumber.country
  }

  public async sendVerificationCodeSms(
    phone: string,
    code: string,
    language: string,
    msgType: SMSMsgType,
  ) {
    const phoneNumber = parsePhoneNumber(phone)

    if (phoneNumber && phoneNumber.country === 'CN') {
      // If the registration number is from China, the SMS will be sent by Alibaba Cloud.
      const template_code = this.template_ids[msgType]

      if (msgType === SMSMsgType.signup) {
        await this.aliCloudSmsService.sendSms(
          phone,
          JSON.stringify({ code }),
          template_code,
        )
      }
      else {
        // reset password
        await this.aliCloudSmsService.sendSms(
          phone,
          JSON.stringify({ code }),
          template_code,
        )
      }
    }
    else {
      // send random number to the phone number
      let msg = this.getVerificationMsg(language, msgType)
      try {
        msg = msg.replace('0000', code)
      }
      catch {
        msg = SMSTranslateMsg[Language.EN_US][msgType].replace('0000', code)
      }
      await this.twilioService.sendSms(phone, msg)
    }
  }
}
