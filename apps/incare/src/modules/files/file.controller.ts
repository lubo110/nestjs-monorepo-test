import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { RolesGuard } from '../guards/roles.guard'
import { Permissions } from '../shared/decorators/permission.decorator'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import { saveImageHelper } from '../shared/utils/image-helper'
import {
  FileRemoveDTO,
  QueryFileParamsDTO,
  QueryListFileDTO,
} from './file.dto'
import { FileService } from './file.service'

@Permissions('admin')
@UseGuards(RolesGuard)
@Controller()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseInterceptors(FileInterceptor('file', saveImageHelper))
  @UseInterceptors(LoggerInterceptor)
  @Post('/gcs/upload')
  async uploadFileToGCS(@UploadedFile() file: any, @Body('user_id') user_id) {
    if (!file) {
      throw new BadRequestException('File is required', 'Validation Failed')
    }

    const buf = file?.buffer
    file.buffer = Buffer.from(buf)
    return this.fileService.uploadFileToGCS(file, user_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete('/gcs/delete')
  async removeFileFromGCS(@Body(new ValidationPipe()) body: FileRemoveDTO) {
    return this.fileService.removeFiles(body.file_ids)
  }

  @UseInterceptors(LoggerInterceptor)
  @Get('/gcs/find/:user_id/:file_id/')
  async getFileInfos(@Param(new ValidationPipe()) params: QueryFileParamsDTO) {
    return this.fileService.getFileInfo(params.file_id, params.user_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/gcs/find/all')
  async getListFiles(
    @Body(new ValidationPipe({ transform: true })) body: QueryListFileDTO,
  ) {
    return this.fileService.getListFiles(body)
  }
}
