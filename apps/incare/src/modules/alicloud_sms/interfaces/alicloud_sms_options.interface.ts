export interface AliCloudSmsOptions {
  config: {
    /**
     * AliCloud account accessKey ID.
     *
     * @see https://usercenter.console.aliyun.com/#/manage/ak
     * @type {string}
     */
    accessKeyId: string

    /**
     * AliCloud account accessKey secret.
     *
     * @see https://usercenter.console.aliyun.com/#/manage/ak
     * @type {string}
     */
    accessKeySecret: string

    /**
     * AliCloud API service url.
     *
     * @default 'https://dysmsapi.aliyuncs.com'
     * @type {string}
     */
    endpoint?: string

    /**
     * AliCloud SMS API version.
     *
     * @default 2017-05-25
     * @type {string}
     */
    apiVersion?: string

    opts?: {
      /**
       * @default 3000
       * @type {number}
       */
      timeout?: number

      /**
       * Format the parameter name to first letter upper case
       *
       * @default true
       * @type {boolean}
       */
      formatParams?: boolean

      /**
       * Set the http method
       *
       * @default GET
       * @type {('GET' | 'POST')}
       */
      method?: 'GET' | 'POST'

      /**
       * Http request headers
       *
       * @type {object}
       */
      headers?: object
    }
  }
  defaults?: {
    /**
     * SMS message template ID.
     *
     * @see 請在控制台模版管理頁面模版CODE一列查看。
     * @type {string}
     */
    templateCode?: string

    /**
     * SMS message sign name.
     *
     * @see 請在控制台模版管理頁面模版CODE一列查看。
     * @type {string}
     */
    signName?: string

    /**
     * AliCloud region ID.
     *
     * @type {string}
     */
    regionId?: string
  }

  /**
   * Log sent message on dashboard.
   *
   * @default false
   * @type {boolean}
   * @memberof AliCloudSmsOptions
   */
  logger?: boolean
}
