import { registerAs } from '@nestjs/config'

export default registerAs('push', () => ({
  jpush: {
    appKey: process.env.JPUSH_APP_KEY,
    masterSecret: process.env.JPUSH_MASTER_SECRET,
  },
  apn: {
    key: process.env.APN_KEY,
    keyId: process.env.APN_KEYID,
    teamId: process.env.APN_TEAMID,
    bundleId: process.env.APN_BUNDLEID,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim(),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
}))
