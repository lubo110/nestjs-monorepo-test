import { Bucket, Storage } from '@google-cloud/storage'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { storageConfig, StorageConfig } from '@incare/config/index'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { IFile } from '../shared/interfaces/common.interface'

@Injectable()
export class GoogleStorageService {
  private storage: Storage
  private bucket: Bucket

  constructor(
    @Inject(storageConfig.KEY)
    private readonly storageConfig: StorageConfig,
  ) {
    this.storage = new Storage({
      projectId: this.storageConfig.gcs.projectId,
      credentials: {
        client_email: this.storageConfig.gcs.clientEmail,
        private_key: this.storageConfig.gcs.privateKey,
      },
    })
    this.bucket = this.storage.bucket(this.storageConfig.gcs.bucketMedia)
  }

  async uploadFile(uploadedFile: IFile, target_name: string): Promise<any> {
    const file = this.bucket.file(target_name)
    try {
      await file.save(uploadedFile.buffer, {
        public: true,
        contentType: uploadedFile.mimetype,
      })
    }
    catch (error) {
      throw new ApiException(
        error?.message,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    return {
      ...file.metadata,
      public_url: `https://storage.googleapis.com/${this.bucket.name}/${file.name}`,
    }
  }

  async removeFiles(filenames: string[]): Promise<void> {
    filenames.forEach(async (filename) => {
      try {
        const file = this.bucket.file(filename)
        await file.delete()
      }
      catch (error) {
        throw new ApiException(
          error?.message,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    })
  }

  async removeSingleFile(fileName: string): Promise<void> {
    try {
      const file = this.bucket.file(fileName)
      await file.delete()
    }
    catch (error) {
      throw new ApiException(
        error?.message,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getListFiles() {
    try {
      const [files] = await this.bucket.getFiles()
      const fileInfos = []
      files.forEach((file) => {
        fileInfos.push({
          name: file.name,
          url: file.metadata.mediaLink,
        })
      })
      return fileInfos
    }
    catch {
      throw new ApiException(
        'Unable to read list of files!',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async isFileExists(filename: string): Promise<[boolean]> {
    return await this.bucket.file(filename).exists()
  }
}
