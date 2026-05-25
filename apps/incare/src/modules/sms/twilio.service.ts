import { Inject, Injectable, Logger } from '@nestjs/common'
import * as twilio from 'twilio'
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message'
import { SmsConfig, smsConfig } from '@incare/config/index'

@Injectable()
export default class TwilioService {
  private client: twilio.Twilio

  private logger = new Logger(TwilioService.name)

  constructor(
    @Inject(smsConfig.KEY)
    private readonly sms: SmsConfig,
  ) {
    const accountSid = this.sms.twilio.accountSid
    const authToken = this.sms.twilio.authToken

    if (!accountSid || !authToken) {
      throw new Error('Twilio account SID/auth token not found')
    }

    this.client = twilio(accountSid, authToken)
  }

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    const options: MessageListInstanceCreateOptions = {
      body: message,
      to: phoneNumber,
    }

    this.client.messages
      .create({ body: options.body, from: '+12028311998', to: options.to })
      .then((message) => {
        console.log('message:', message)

        this.logger.log(
          `Sent message [${message.sid}] to "${options.to}" successfully.`,
          'TwilioService',
        )
      })
      .catch((error) => {
        this.logger.error(`Failed to send SMS: ${error.message}`, error.stack)
      })
  }
}
