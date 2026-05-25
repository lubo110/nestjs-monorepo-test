import * as crypto from 'node:crypto'

export class ApiKeyService {
  // 生成密鑰
  generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  generateApiIdAndKey(): { api_id: string, api_key: string } {
    const api_id = crypto.randomUUID()
    const api_key = crypto.randomBytes(32).toString('hex')
    return { api_id, api_key }
  }

  // 存儲密鑰 (存儲哈希)
  async hashApiKey(api_key: string): Promise<string> {
    const hashed_api_key = crypto
      .createHash('sha256')
      .update(api_key)
      .digest('hex')
    return hashed_api_key
  }

  // 生成第三方客戶的完整密鑰信息，包括原始 api_key 和 hashed_api_key
  async createThirdPartyApiKey(): Promise<{
    api_key: string
    hashed_api_key: string
  }> {
    try {
      const api_key = this.generateApiKey()
      const hashed_api_key = await this.hashApiKey(api_key)

      // 返回生成的密鑰信息
      return { api_key, hashed_api_key }
    }
    catch (error) {
      throw new Error(`Error generating third-party API key: ${error.message}`)
    }
  }
}
