import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { GoogleStorageService } from '../storage/google.storage.service'
import { UserModule } from '../users/user.module'
import { FileController } from './file.controller'
import { File, FileSchema } from './file.schema'
import { FileService } from './file.service'

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature(
      [{ name: File.name, schema: FileSchema }],
      'sharedConnection',
    ),
  ],
  controllers: [FileController],
  providers: [FileService, GoogleStorageService],
  exports: [FileService],
})
export class FileModule {}
