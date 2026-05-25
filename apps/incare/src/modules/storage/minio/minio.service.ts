import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import * as Minio from 'minio'
import { MINIO_CLIENT } from './minio.constants'

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly bucketName = 'reports'

  constructor(
    @Inject(MINIO_CLIENT)
    private readonly minioClient: Minio.Client,
  ) {}

  async onModuleInit() {
    const exists = await this.minioClient.bucketExists(this.bucketName)
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName)
    }
  }

  async upload(
    objectName: string,
    buffer: Buffer,
    contentType = 'application/pdf',
  ) {
    return this.minioClient.putObject(
      this.bucketName,
      objectName,
      buffer,
      undefined,
      { 'content-type': contentType },
    )
  }

  async remove(objectName: string) {
    await this.minioClient.removeObject(this.bucketName, objectName)
  }

  async getPresignedUrl(objectName: string) {
    if (!objectName) {
      return ''
    }
    return this.minioClient.presignedGetObject(
      this.bucketName,
      objectName,
    )
  }

  async getState(objectName: string) {
    return this.minioClient.statObject(this.bucketName, objectName)
  }
}
