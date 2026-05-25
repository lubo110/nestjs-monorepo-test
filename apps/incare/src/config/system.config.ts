import { registerAs } from '@nestjs/config'

export default registerAs('system', () => ({
  axiosTimeout: Number(process.env.AXIOS_TIMEOUT) || 60000,
  changeModelFlag: process.env.CHANGE_MODEL_FLAG === 'true',
  useSms: process.env.USE_SMS === 'true',
}))
