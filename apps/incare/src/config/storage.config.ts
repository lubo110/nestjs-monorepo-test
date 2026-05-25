import { registerAs } from '@nestjs/config'

export default registerAs('storage', () => ({
  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT) || 9100,
    useSSL: process.env.MINIO_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  },
  gcs: {
    projectId: process.env.GCS_PROJECT_ID,
    clientEmail: process.env.GCS_CLIENT_EMAIL,
    privateKey: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n').trim(),
    bucketMedia: process.env.GCS_STORAGE_MEDIA_BUCKET,
  },
}))
