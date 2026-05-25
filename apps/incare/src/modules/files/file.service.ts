import { parse } from 'node:path'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  FileType,
  OrderByType,
  WaffleRequestStatus,
} from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { IFile, WaffleResponse } from '../shared/interfaces/common.interface'
import { GoogleStorageService } from '../storage/google.storage.service'
import { UserService } from '../users/user.service'
import { QueryListFileDTO } from './file.dto'
import { File, FileDocument } from './file.schema'

@Injectable()
export class FileService {
  private response: WaffleResponse
  logger = new Logger(FileService.name)
  constructor(
    @InjectModel(File.name, 'sharedConnection')
    private readonly fileModel: Model<FileDocument>,
    private readonly gsService: GoogleStorageService,
    private readonly userService: UserService,
  ) {}

  private setDestination(destination: string): string {
    let escDestination = ''
    escDestination += destination
      .replace(/^\.+/g, '')
      .replace(/^\/+|\/+$/g, '')
    if (escDestination !== '')
      escDestination = `${escDestination}/`
    return escDestination
  }

  private setFilename(uploadedFile: IFile): string {
    const fileName = parse(uploadedFile.originalname)
    return `${fileName.name}-${Date.now()}${fileName.ext}`
      .replace(/^\.+/g, '')
      .replace(/^\/+/g, '')
      .replace(/\r|\n/g, '_')
  }

  async uploadFileToGCS(
    file: IFile,
    user_id: string,
    destination: string = 'data/',
  ) {
    const user = await this.userService.findByUserId(user_id)
    if (!user) {
      throw new ApiException(
        'User not found',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const target_name
      = this.setDestination(destination) + this.setFilename(file)

    const metadata = await this.gsService.uploadFile(file, target_name)
    if (metadata.size > 0) {
      try {
        const res = await this.fileModel.create({
          file_type: FileType.IMG,
          origin_file_name: file.originalname,
          target_file_name: metadata.name,
          target_url: metadata.public_url,
          upload_user: user_id,
        })
        return (this.response = {
          code: WaffleRequestStatus.SUCCESS,
          data: res,
        })
      }
      catch (e) {
        this.logger.error(e)
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
  }

  async getFileInfo(file_id: string, user_id: string) {
    const user = await this.userService.findByUserId(user_id)
    if (!user) {
      throw new ApiException(
        'User not found',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    try {
      const foundFileInfo = await this.fileModel.findOne({ _id: file_id })
      if (!foundFileInfo) {
        throw new ApiException(
          'File not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: foundFileInfo,
      })
    }
    catch (e) {
      throw e
    }
  }

  async getListFiles(body: QueryListFileDTO) {
    const { user_id, start_num, end_num, order_by, file_type } = body
    const query_num = end_num - start_num + 1
    const skip_num = start_num - 1
    const sort = OrderByType.DESC === order_by ? -1 : 1

    const user = await this.userService.findByUserId(user_id)
    if (!user) {
      throw new ApiException(
        'User not found',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    const filter: any = {}
    if (file_type) {
      filter.file_type = file_type
    }
    try {
      const foundFiles = await this.fileModel
        .find(filter)
        .sort({ _id: sort })
        .limit(query_num)
        .skip(skip_num)

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: foundFiles,
      })
    }
    catch (e) {
      this.logger.error(e)
      throw new ApiException(
        'PROCESS_FAILED',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async removeFiles(file_ids: string[]) {
    try {
      const filenames: string[] = []
      const files = await this.fileModel.find({ _id: { $in: file_ids } })

      files.forEach((file) => {
        if (file.target_file_name) {
          filenames.push(file.target_file_name)
        }
      })

      // delete file from gcs
      if (filenames.length > 0) {
        await this.removeFileFromGCS(filenames)
      }

      // delete file's record in database
      await this.fileModel.deleteMany({
        _id: { $in: file_ids },
      })

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
        message: `The file has been deleted successfully`,
      })
    }
    catch (e) {
      this.logger.error(e)
      throw new ApiException(
        'PROCESS_FAILED',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async removeFileFromGCS(filenames: string[]) {
    try {
      for (const i in filenames) {
        const isFileExists = await this.gsService.isFileExists(filenames[i])
        if (isFileExists[0]) {
          await this.gsService.removeSingleFile(filenames[i])
        }
        else {
          console.log(`${filenames[i]} 不存在，視為已刪除成功`)
        }
      }
    }
    catch (e) {
      this.logger.error(e)
      throw new ApiException(
        'PROCESS_FAILED',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
