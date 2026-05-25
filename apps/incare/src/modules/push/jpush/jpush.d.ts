declare module 'jpush-async' {
  export interface PushPayload {
    /**
     * 设置 platform，本方法接收 JPush.ALL, android, ios这几个参数
     * @param platforms
     * @returns
     */
    setPlatform: (...platforms: string[]) => PushPayload
    /**
     * 设置 audience，本方法接收 JPush.ALL，或者是 tag(), tag_and(), alias(), registration_id()
     * @param audiences
     * @returns
     */
    setAudience: (...audiences: any[]) => PushPayload
    setNotification: (alert: string, ...options: any[]) => PushPayload
    /**
     * 设置 message，本方法接受 4 个参数msg_content(string,必填), title(string), content_type(string), extras(Object)
     * @param msg_content
     * @param title
     * @param content_type
     * @param extras
     * @returns
     */
    setMessage: (
      msg_content: string,
      title?: string,
      content_type?: string,
      extras?: Record<string, any>
    ) => PushPayload
    /**
     * 推送当前 payload 对象
     * @returns
     */
    send: () => Promise<any>
  }

  export interface JPushClient {
    push: () => PushPayload
  }

  export const JPushAsync: {
    /**
     * 创建 audience 的 alias 属性
     * @param alias
     * @returns
     */
    alias: (alias: string) => any
    buildClient: (
      appKey: string,
      masterSecret: string,
      timeout?: number
    ) => JPushClient
  }
}
