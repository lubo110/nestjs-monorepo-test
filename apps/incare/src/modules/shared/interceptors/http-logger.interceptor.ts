import * as fs from 'node:fs'
import * as path from 'node:path'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

@Injectable()
export class HttpLoggerInterceptor implements OnModuleInit {
  private readonly logger = new Logger(HttpLoggerInterceptor.name)
  private readonly logDir = path.join(process.cwd(), 'logs')

  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    this.logger.log('🚀 HttpLoggerInterceptor 初始化...')
    this.setupInterceptor()
  }

  private setupInterceptor() {
    this.logger.log('✅ 設定 Axios 攔截器...')

    this.httpService.axiosRef.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        this.logger.log(
          `📤 發送請求: ${config.method?.toUpperCase()} ${config.url}`,
        )
        this.logRequest(config)
        return config
      },
      (error: AxiosError) => {
        this.logError('request', error)
        return Promise.reject(error)
      },
    )

    this.httpService.axiosRef.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.log(
          `📥 接收回應: ${response.status} ${response.config.url}`,
        )
        this.logResponse(response)
        return response
      },
      (error: AxiosError) => {
        this.logError('response', error)
        return Promise.reject(error)
      },
    )
  }

  private logRequest(config: InternalAxiosRequestConfig) {
    console.log('📡 擷取請求:', config.method, config.url)
    this.writeLog(
      {
        type: 'request',
        timestamp: new Date().toISOString(),
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data,
      },
      'request',
    )
  }

  private logResponse(response: AxiosResponse) {
    console.log('📡 擷取請求:', response.status, response.config.url)
    this.writeLog(
      {
        type: 'response',
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        headers: response.headers,
        data: response.data,
      },
      'response',
    )
  }

  private logError(type: 'request' | 'response', error: AxiosError) {
    this.writeLog(
      {
        type: `${type}-error`,
        timestamp: new Date().toISOString(),
        message: error.message,
        url: error.config?.url || 'unknown',
        method: error.config?.method || 'unknown',
        status: error.response?.status || 'unknown',
        data: error.response?.data || 'unknown',
      },
      `${type}-error`,
    )
  }

  private writeLog(logData: any, prefix: string) {
    console.log('📁 Log 路徑:', this.logDir)
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const logFilePath = path.join(this.logDir, `${prefix}_${timestamp}.json`)

    try {
      fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8')
      console.log('✅ 檔案寫入成功:', logFilePath)
    }
    catch (error) {
      console.error('❌ 檔案寫入失敗:', error)
    }
  }
}
