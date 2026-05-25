import { registerAs } from '@nestjs/config'

export default registerAs('auth', () => ({
  jwt: {
    secretUserV1: process.env.JWT_SECRET_V1_USER,
    secretUserV2: process.env.JWT_SECRET_V2_USER,
    secretDoctor: process.env.JWT_SECRET_DOCTOR_USER,
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  },
}))
