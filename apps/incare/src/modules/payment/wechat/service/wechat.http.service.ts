import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { AxiosError, AxiosRequestConfig } from 'axios'
import { catchError, firstValueFrom } from 'rxjs'
import { RequestOptions } from '../types'
import { WechatPayCryptoService } from './wechat.crypto.service'

@Injectable()
export class WechatPayHttpService {
  private readonly logger = new Logger(WechatPayHttpService.name)
  constructor(
    private readonly httpService: HttpService,
    private wechatPayCryptoService: WechatPayCryptoService,
  ) {}

  /**
   * 微信支付通用请求方法
   * @param options 请求参数
   * @returns  Promise<T>
   */
  async request<T = any>(options: RequestOptions): Promise<T> {
    const { method, url } = options
    const headers = this.getHeaders(options)
    const axiosConfig: AxiosRequestConfig = {
      method,
      url,
      headers,
      data: method === 'GET' ? undefined : options.body,
    }
    try {
      const response = await firstValueFrom(
        this.httpService.request<T>(axiosConfig).pipe(
          catchError((error: AxiosError) => {
            this.handleRequestError(error)
            throw error
          }),
        ),
      )
      return response.data as T
    }
    catch (error) {
      throw error
    }
  }

  private getHeaders(options: RequestOptions) {
    const authorization = this.wechatPayCryptoService.generateAuthorization(options)
    const baseHeaders = { Authorization: authorization }
    if (options.method === 'GET') {
      return baseHeaders
    }
    return {
      ...baseHeaders,
      'Content-Type': 'application/json',
    }
  }

  private handleRequestError(error: AxiosError): void {
    if (error.response) {
    // 接口有响应，但返回错误
      const { status, data } = error.response
      this.logger.error(`[WechatPayHttpService] 微信支付接口返回错误`, {
        status,
        url: error.config?.url,
        method: error.config?.method,
        responseData: data,
      })
    }
    else if (error.request) {
    // 请求已发送，但没有收到响应
      this.logger.error(`[WechatPayHttpService] 微信支付请求无响应或超时`, {
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data,
      })
    }
    else {
    // 请求配置错误
      this.logger.error(`[WechatPayHttpService] 微信支付请求配置错误`, {
        message: error.message,
        config: error.config,
      })
    }
  }
}
