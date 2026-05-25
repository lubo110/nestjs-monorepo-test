import { registerAs } from '@nestjs/config'

export default registerAs('third', () => ({
  dindin: {
    appIdKey: process.env.DINDIN_APP_ID_KEY,
    timestampKey: process.env.DINDIN_TIMESTAMP_KEY,
    appId: process.env.DINDIN_APP_ID,
    secretKey: process.env.DINDIN_SECRET_KEY,
    thirdPartyId: process.env.DINDIN_THIRD_PARTY_ID,
    apiHost: process.env.DINDIN_API_HOST,
    apiPort: Number(process.env.DINDIN_API_PORT),
    apiBasePath: process.env.DINDIN_API_BASE_PATH,
  },
}))
