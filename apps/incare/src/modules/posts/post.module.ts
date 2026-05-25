import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigurationModule } from '../configuration/configuration.module'
import { Favorite, FavoriteSchema } from '../favorites/favorite.schema'
import { FavoriteService } from '../favorites/favorite.service'
import { FileModule } from '../files/file.module'
import { PostUser, PostUserSchema } from '../post_users/post_user.schema'
import { PostUsersService } from '../post_users/post_users.service'
import { UserModule } from '../users/user.module'
import { PostController } from './post.controller'
import { Post, PostSchema } from './post.schema'
import { PostService } from './post.service'

@Module({
  imports: [
    UserModule,
    FileModule,
    ConfigurationModule,
    MongooseModule.forFeature(
      [
        { name: Post.name, schema: PostSchema },
        { name: PostUser.name, schema: PostUserSchema },
        { name: Favorite.name, schema: FavoriteSchema },
      ],
      'sharedConnection',
    ),
  ],
  controllers: [PostController],
  providers: [PostService, FavoriteService, PostUsersService],
  exports: [PostService],
})
export class PostModule {}
