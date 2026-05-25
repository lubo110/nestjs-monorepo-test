import * as RPCClient from '@alicloud/pop-core'
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { ALICLOUD_SMS_MODULE_OPTIONS } from './alicloud_sms.constant'
import { AliCloudSmsOptions, AliCloudSmsResponse } from './interfaces'

@Injectable()
export class AliCloudSmsService {
  private maxRetries = 3 // 設置最大重試次數
  private retryInterval = 60 * 1000 // 設置重試間隔時間
  private client: RPCClient

  constructor(
    @Inject(ALICLOUD_SMS_MODULE_OPTIONS)
    private options: AliCloudSmsOptions,
  ) {
    const config = {
      ...{
        endpoint: 'https://dysmsapi.aliyuncs.com',
        apiVersion: '2017-05-25',
      },
      ...options.config,
    }
    this.client = new RPCClient(config)
  }

  /**
   * Send message.
   * @template T
   * @param {string | string[]} phone_numbers 發送的簡訊號碼
   * @param {T} template_param 簡訊的模版變數對應值，JSON格式
   * @param {string} template_code 簡訊的模版ID
   * @param {string} [sign_name] 簡訊的模版簽名名稱
   * @param {string} [region_id] 地區ID
   * @returns {(Promise<boolean | null>)} Promise<boolean | null>
   * @memberof AliCloudSmsService
   */
  public async sendSms(
    phone_numbers: string | string[],
    template_param: object | string,
    template_code?: string,
    sign_name?: string,
    region_id?: string,
  ): Promise<AliCloudSmsResponse | null> {
    if (!template_code && !this.options?.defaults?.templateCode) {
      Logger.error('Error encountered: "TemplateCode" was not provided.')
    }

    if (!sign_name && !this.options?.defaults?.signName) {
      Logger.error('Error encountered: "SignName" was not provided.')
    }

    if (!region_id && !this.options?.defaults?.regionId) {
      Logger.error('Error encountered: "RegionId" was not provided.')
    }

    const params = {
      TemplateCode: template_code ?? this.options.defaults.templateCode,
      RegionId: region_id ?? this.options.defaults.regionId,
      SignName: sign_name ?? this.options.defaults.signName,
      PhoneNumbers: Array.isArray(phone_numbers)
        ? phone_numbers.join(',')
        : phone_numbers,
      TemplateParam:
        typeof template_param === 'string'
          ? template_param
          : JSON.stringify(template_param),
    }

    try {
      const requestOption = { method: 'POST' }
      const response: AliCloudSmsResponse = await this.client.request(
        'SendSms',
        params,
        requestOption,
      )

      if (response.Message === 'OK') {
        Logger.log(
          `Sent message to "${params.PhoneNumbers}" successfully.`,
          'AliCloudSmsService',
        )
      }
      else {
        Logger.warn(
          `Sent message to "${params.PhoneNumbers}" failed, response "${response.Message}".`,
          'AliCloudSmsService',
        )
      }

      return response
    }
    catch (err) {
      Logger.error(err, 'AliCloudSmsService')
      // Logger.error(
      //   `Preparing to Retry AliCloud SMS Delivery`,
      //   "AliCloudSmsService"
      // );
      // await this.retrySendSms(phoneNumbers, templateParam, this.maxRetries);
      throw new ApiException(
        `PROCESS_FAILED:${err}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  private async retrySendSms(
    phoneNumbers: string | string[],
    templateParam: object | string,
    retries: number,
  ) {
    Logger.log(
      `Resend SMS to ${phoneNumbers} Attempt #${retries}`,
      'AliCloudSmsService',
    )
    try {
      await this.sendSms(phoneNumbers, templateParam)
    }
    catch {
      Logger.error(
        `Failed to resend SMS to ${phoneNumbers} on Attempt #${retries}`,
        'AliCloudSmsService',
      )
      // 發送失敗
      if (retries > 0) {
        // 仍有重試次數，等待一段時間後進行重寄簡訊
        await this.delay(this.retryInterval)
        await this.retrySendSms(phoneNumbers, templateParam, retries - 1)
      }
      else {
        Logger.error(
          `Failed to send AliCloud SMS after ${this.maxRetries} retries.`,
          'AliCloudSmsService',
        )
      }
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
