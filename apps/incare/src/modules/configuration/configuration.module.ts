import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Post, PostSchema } from '../posts/post.schema'
import { ConfigurationController } from './configuration.controller'
import { Configuration, ConfigurationSchema } from './configuration.schemas'
import { ConfigurationService } from './configuration.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Configuration.name, schema: ConfigurationSchema },
        { name: Post.name, schema: PostSchema },
      ],
      'sharedConnection',
    ),
  ],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
