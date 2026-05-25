import * as crypto from 'node:crypto'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { paymentConfig, PaymentConfig } from '@incare/config/index'
import { isPlainObject } from '@incare/modules/shared/utils/util'
import { AppPaySignResult, RequestOptions, SignatureOptions } from '../types'

@Injectable()
export class WechatPayCryptoService {
  private readonly logger = new Logger(WechatPayCryptoService.name)
  private readonly mchId: string
  private readonly appId: string
  private readonly privateKey: string
  private readonly platformPublicKey: string
  private readonly apiV3Key: string
  private readonly serialNo: string
  private authType = 'WECHATPAY2-SHA256-RSA2048'

  constructor(
    @Inject(paymentConfig.KEY)
    private readonly paymentConfig: PaymentConfig,
  ) {
    const { appId, mchId, privateKey, platformPublicKey, apiV3Key, serialNo } = this.paymentConfig.wechat
    this.appId = appId
    this.mchId = mchId
    this.privateKey = privateKey
    this.platformPublicKey = platformPublicKey
    this.apiV3Key = apiV3Key
    this.serialNo = serialNo
  }

  getAppId(): string {
    return this.appId
  }

  getMchId(): string {
    return this.mchId
  }

  /**
   * 获取 Authorization 信息
   */
  generateAuthorization(options: RequestOptions): string {
    const timestamp = this.getTimestamp()
    const nonce = this.generateNonce()

    // ✅ 改成字符串化日志
    this.logger.debug(
      `[Auth] generate authorization start ${JSON.stringify({
        method: options.method,
        url: options.url,
        hasBody: !!options.body,
      })}`,
    )

    const signature = this.generateSignature({
      ...options,
      timestamp,
      nonce,
    })

    this.logger.debug(
      `[Auth] authorization meta ${JSON.stringify({
        mchId: this.mchId,
        serialNo: this.serialNo,
        timestamp,
        nonce,
        signaturePreview: signature, // `${signature.slice(0, 8)}...`,
      })}`,
    )

    return `${this.authType} mchid="${this.mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${this.serialNo}",signature="${signature}"`
  }

  /**
   * 生成 V3 接口签名
   */
  generateSignature(options: SignatureOptions): string {
    const { method, url, timestamp, nonce, body = '' } = options
    const bodyStr = this.normalizeBody(body)
    const signString = `${method.toUpperCase()}\n${url}\n${timestamp}\n${nonce}\n${bodyStr}\n`

    this.logger.debug(
      `[Sign] sign string generated ${JSON.stringify({
        method: method.toUpperCase(),
        url,
        timestamp,
        nonce,
        bodyLength: bodyStr.length,
        signString,
      })}`,
    )

    return this.sign(signString)
  }

  /**
   * SHA256withRSA
   */
  sign(data: string) {
    if (!this.privateKey)
      throw new Error('商户私钥未配置')

    this.logger.debug(`[RSA] sign start dataLength=${data.length}`)

    const signature = crypto.createSign('RSA-SHA256').update(data).sign(this.privateKey, 'base64')

    this.logger.debug(`[RSA] sign success signaturePreview=${signature}`)

    return signature
  }

  /**
   * 验证签名
   */
  verifySignature(timestamp: string, nonce: string, signature: string, body: string): boolean {
    const verifyStr = `${timestamp}\n${nonce}\n${body}\n`
    this.logger.debug(
      `[Verify] start verify signature ${JSON.stringify({
        timestamp,
        nonce,
        bodyLength: body.length,
        signaturePreview: signature, // `${signature.slice(0, 8)}...`,
      })}`,
    )

    try {
      const result = crypto.createVerify('RSA-SHA256').update(verifyStr).verify(this.platformPublicKey, signature, 'base64')
      this.logger.debug(`[Verify] verify result ${result}`)
      return result
    }
    catch (err) {
      this.logger.error('[Verify] verify exception', err)
      return false
    }
  }

  /**
   * 解密回调数据（AES-256-GCM）
   */
  decryptAesGcm(associatedData: string, nonce: string, ciphertext: string): string {
    if (!this.apiV3Key)
      throw new Error('[decryptAesGcm] API v3 Key 未配置!')

    this.logger.debug(
      `[AES-GCM] decrypt start ${JSON.stringify({
        associatedData,
        nonce,
        cipherLength: ciphertext.length,
      })}`,
    )

    try {
      const key = Buffer.from(this.apiV3Key, 'utf8')
      const dataBuffer = Buffer.from(ciphertext, 'base64')
      const authTag = dataBuffer.subarray(dataBuffer.length - 16)
      const encryptedData = dataBuffer.subarray(0, dataBuffer.length - 16)

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce)
      decipher.setAuthTag(authTag)
      decipher.setAAD(Buffer.from(associatedData))

      const decrypted = decipher.update(encryptedData, undefined, 'utf8') + decipher.final('utf8')
      this.logger.debug('[AES-GCM] decrypt success')
      return decrypted
    }
    catch (err) {
      this.logger.error('[AES-GCM] decrypt failed', err)
      throw err
    }
  }

  /**
   * 生成 APP 支付签名
   */
  generateAppPaySign(prepayId: string): AppPaySignResult {
    const timestamp = this.getTimestamp()
    const nonce = this.generateNonce()
    const signString = `${this.appId}\n${timestamp}\n${nonce}\n${prepayId}\n`

    this.logger.debug(
      `[APP Pay] sign string ${JSON.stringify({
        appId: this.appId,
        timestamp,
        nonce,
        prepayId,
        signString,
      })}`,
    )

    const signature = this.sign(signString)

    return {
      app_id: this.appId,
      partner_id: this.mchId,
      prepay_id: prepayId,
      package: `Sign=WXPay`,
      nonce,
      timestamp,
      sign: signature,
    } as AppPaySignResult
  }

  // ========== 工具方法 ==========
  private normalizeBody(body: unknown): string {
    if (body === null || body === undefined)
      return ''
    return isPlainObject(body) ? JSON.stringify(body) : String(body)
  }

  private generateNonce() {
    return crypto.randomBytes(16).toString('hex')
  }

  private getTimestamp() {
    return Math.floor(Date.now() / 1000).toString()
  }
}
