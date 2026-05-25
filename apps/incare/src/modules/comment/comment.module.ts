import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AiModule } from '../ai/ai.module'
import { ConfigurationModule } from '../configuration/configuration.module'
import { Diagnosis, DiagnosisSchema } from '../diagnosis/diagnosis.schemas'
import { ModelsInfoModule } from '../models_Info/models_Info.module'
import { NotificationModule } from '../notification/notification.module'
import { MinioModule } from '../storage/minio/minio.module'
import { UserModule } from '../users/user.module'
import { CommentController } from './comment.controller'
import { Comment, CommentSchema } from './comment.schemas'
import { CommentService } from './comment.service'

@Module({
  imports: [
    UserModule,
    ModelsInfoModule,
    ConfigurationModule,
    MinioModule,
    MongooseModule.forFeature(
      [
        { name: Comment.name, schema: CommentSchema },
        { name: Diagnosis.name, schema: DiagnosisSchema },
      ],
      'sharedConnection',
    ),
    NotificationModule,
    AiModule,
  ],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
