import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { FavoriteService } from '../favorites/favorite.service'
import { RolesGuard } from '../guards/roles.guard'
import { Permissions } from '../shared/decorators/permission.decorator'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import {
  CreatePostDTO,
  PublishPostDTO,
  QueryListPostDTO,
  QueryPostParamsDTO,
  UpdatePostDTO,
} from './post.dto'
import { PostService } from './post.service'

@Controller()
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly favoriteService: FavoriteService,
  ) {}

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Post('/post/create')
  async createPost(@Body(new ValidationPipe()) body: CreatePostDTO) {
    return this.postService.createPost(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Get('/post/:user_id/:post_id')
  async getPostByPostId(
    @Param(new ValidationPipe()) params: QueryPostParamsDTO,
  ) {
    return this.postService.getPost(params.post_id, params.user_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Patch('/post/edit')
  async editPost(
    @Body(new ValidationPipe({ whitelist: true })) body: UpdatePostDTO,
  ) {
    return this.postService.editPost(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Delete('/post/:user_id/:post_id')
  async deletePost(@Param(new ValidationPipe()) params: QueryPostParamsDTO) {
    return this.postService.deletePost(params.post_id, params.user_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/post/find/list')
  async getListPosts(
    @Body(new ValidationPipe({ transform: true })) body: QueryListPostDTO,
  ) {
    return this.postService.getListPosts(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Patch('/post/schedule')
  async publishPost(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: PublishPostDTO,
  ) {
    return this.postService.setPublishTime(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Patch('/post/:user_id/:post_id/:enable')
  async disablePost(
    @Param(new ValidationPipe({ transform: true, whitelist: true }))
    params: QueryPostParamsDTO,
  ) {
    return this.postService.disablePost(
      params.post_id,
      params.user_id,
      params.enable,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/post/user/save')
  async savePost(
    @Body(new ValidationPipe({ whitelist: true }))
    body: QueryPostParamsDTO,
  ) {
    return this.favoriteService.savePost(body.post_id, body.user_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Get('/post/user/:user_id/favorites')
  async getUserFavorites(@Param('user_id') id: string) {
    return this.favoriteService.getUserFavorites(id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete('/post/user/:user_id/:post_id')
  async removeSavedPost(
    @Param(new ValidationPipe({ whitelist: true })) params: QueryPostParamsDTO,
  ) {
    return this.favoriteService.removeUserFavorite(
      params.post_id,
      params.user_id,
    )
  }
}
