import { storageConfig, StorageConfig } from '@incare/config/index'

import { Module } from '@nestjs/common'
import * as Minio from 'minio'
import { MINIO_CLIENT } from './minio.constants'
import { MinioService } from './minio.service'

@Module({
  providers: [
    {
      provide: MINIO_CLIENT,
      inject: [storageConfig.KEY],
      useFactory: (storage: StorageConfig) => {
        const minioCfg = storage.minio
        return new Minio.Client({
          endPoint: minioCfg.endpoint,
          port: minioCfg.port,
          useSSL: minioCfg.useSSL,
          accessKey: minioCfg.accessKey,
          secretKey: minioCfg.secretKey,
        })
      },
    },
    MinioService,
  ],
  exports: [MinioService],
})
export class MinioModule {}
