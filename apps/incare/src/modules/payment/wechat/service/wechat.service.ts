/**
 * WechatPayService
 * 作为微信支付的业务层
 * 对外提供下单 / 查询 / 回调等能力
 */
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { paymentConfig, PaymentConfig } from '@incare/config/index'
import { WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'

import { ApiException } from '@incare/modules/shared/exceptions/api.exception'
import {
  CreateWechatAppOrderInput,
  RequestOptions,
  WeChatPayNotifyResult,
  WechatPayOrderQueryResult,
  WechatPayOrderResponse,
} from '../types'
import { WECHAT_PAY_API } from '../wechat.constants'
import { WechatPayCryptoService } from './wechat.crypto.service'
import { WechatPayHttpService } from './wechat.http.service'

@Injectable()
export class WechatPayService {
  private readonly logger = new Logger(WechatPayService.name)

  constructor(
    private readonly crypto: WechatPayCryptoService,
    private readonly http: WechatPayHttpService,
    @Inject(paymentConfig.KEY)
    private readonly config: PaymentConfig,
  ) { }

  // ======= Getter =======
  get mchId(): string {
    return this.crypto.getMchId()
  }

  get appId(): string {
    return this.crypto.getAppId()
  }

  // ======= Public Methods =======

  /**
   * 创建 APP 支付预支付订单
   */
  async createAppPrepayOrder(input: CreateWechatAppOrderInput) {
    const notifyUrl = this.config.wechat.notifyUrl
    if (!notifyUrl) {
      throw new ApiException(
        '支付成功回调地址缺失，请联系客服进行处理！',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const requestBody = this.buildAppPrepayRequestBody(input, notifyUrl)
    const { prepay_id } = await this.callWechatApi<WechatPayOrderResponse>({
      url: WECHAT_PAY_API.APP_PREPAY,
      method: 'POST',
      body: requestBody,
    })
    const appPaySign = this.crypto.generateAppPaySign(prepay_id)
    return appPaySign
  }

  /**
   * 验证微信回调签名
   */
  verifyNotifySignature(
    timestamp: string,
    nonce: string,
    signature: string,
    rawBody: string,
  ): boolean {
    return this.crypto.verifySignature(timestamp, nonce, signature, rawBody)
  }

  /**
   * 处理支付回调并返回解密后的结果
   */
  decryptNotify(rawBody: string): WechatPayOrderQueryResult {
    const notify = JSON.parse(rawBody) as WeChatPayNotifyResult
    const { associated_data, nonce, ciphertext } = notify.resource

    const decrypted = this.crypto.decryptAesGcm(
      associated_data,
      nonce,
      ciphertext,
    )

    this.logger.log(`[WechatPay Notify] 解密结果: ${decrypted}`)
    return JSON.parse(decrypted) as WechatPayOrderQueryResult
  }

  /**
   * 根据商户订单号查询订单
   */
  async getOrderStatus(outTradeNo: string): Promise<WechatPayOrderQueryResult> {
    return this.callWechatApi<WechatPayOrderQueryResult>({
      url: WECHAT_PAY_API.queryOrderByOutTradeNo(outTradeNo, this.mchId),
      method: 'GET',
    })
  }

  /**
   * 关闭订单
   */
  async cancelOrder(outTradeNo: string): Promise<boolean> {
    await this.callWechatApi({
      url: WECHAT_PAY_API.closeOrderByOutTradeNo(outTradeNo),
      method: 'POST',
      body: { mchid: this.mchId },
    })
    return true
  }

  // ======= Private Methods =======

  /**
   * 构建 APP 支付下单请求体
   */
  private buildAppPrepayRequestBody(
    input: CreateWechatAppOrderInput,
    notifyUrl: string,
  ) {
    const { outTradeNo, description, amount } = input
    return {
      mchid: this.mchId,
      appid: this.appId,
      description,
      out_trade_no: outTradeNo,
      time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟有效
      notify_url: notifyUrl,
      amount: {
        total: amount,
        currency: 'CNY',
      },
    }
  }

  /**
   * 调用微信支付接口并统一处理错误
   */
  private async callWechatApi<T>(options: RequestOptions): Promise<T> {
    try {
      return await this.http.request<T>(options)
    }
    catch (error: any) {
      const errMsg = error?.response?.data?.message || error.message || '调用微信支付接口失败'
      throw new ApiException(
        errMsg,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
