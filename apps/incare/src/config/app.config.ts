import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
  runEnv: process.env.RUN_ENV,
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.SERVER_PORT),
  hostname: process.env.HOSTNAME,
}))
