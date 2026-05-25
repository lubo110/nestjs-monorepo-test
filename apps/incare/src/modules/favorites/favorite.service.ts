import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import moment = require('moment')
import { Model } from 'mongoose'
import { ConfigurationService } from '../configuration/configuration.service'
import { PostService } from '../posts/post.service'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { SystemParams } from '../shared/enums/system.params.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { UserService } from '../users/user.service'
import { Favorite, FavoriteDocument } from './favorite.schema'

@Injectable()
export class FavoriteService {
  private response: WaffleResponse
  constructor(
    @InjectModel(Favorite.name, 'sharedConnection')
    private readonly favoriteModel: Model<FavoriteDocument>,
    private readonly postService: PostService,
    private readonly userService: UserService,
    private readonly configService: ConfigurationService,
  ) {}

  async savePost(post_id: string, user_id: string) {
    try {
      const user = await this.userService.findByUserId(user_id)
      if (!user) {
        throw new ApiException(
          'user not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
      const foundPost = await this.postService.getPostByPostId(post_id)
      if (!foundPost) {
        throw new ApiException(
          'post not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      const save_post = await this.favoriteModel.findOne({ post_id, user_id })
      if (save_post) {
        throw new ApiException(
          'User has already saved the post',
          WaffleRequestStatus.OBJECT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      const res = await this.favoriteModel.create({
        post_id,
        user_id,
      })
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: res,
      })
    }
    catch (e) {
      throw e
    }
  }

  async getUserFavorites(user_id: string) {
    try {
      const user = await this.userService.findByUserId(user_id)
      if (!user) {
        throw new ApiException(
          'user not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
      const res: FavoriteDocument[] = await this.favoriteModel
        .find({ user_id })
        .populate({
          path: 'post_id',
          select: 'title cover_image enabled category lang published_time',
          populate: {
            path: 'cover_image',
            select: 'target_url',
          },
        })
        .sort({ _id: -1 })

      const posts = res.map((post: any) => post.post_id)
      const config_news_categories
        = await this.configService.findOneConfiguration(SystemParams.Categories)
      const config_value = config_news_categories?.value ?? {}

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: posts.map(
          ({
            _id,
            title,
            category,
            lang,
            cover_image,
            enabled,
            published_time,
          }) => {
            const category_details = config_value?.[lang]?.find(
              (item: { category_id: string }) => item.category_id === category,
            )
            return {
              _id,
              title,
              category: category_details || {},
              lang,
              cover_image: cover_image || {},
              enabled,
              published_time: published_time
                ? moment(published_time).format('YYYY-MM-DD')
                : '',
            }
          },
        ),
      })
    }
    catch (e) {
      throw e
    }
  }

  async removeUserFavorite(post_id: string, user_id: string) {
    try {
      const user = await this.userService.findByUserId(user_id)
      if (!user) {
        throw new ApiException(
          'user not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      const favorite = await this.favoriteModel.findOne({
        user_id,
        post_id,
      })

      if (!favorite) {
        throw new ApiException(
          `[post_id：${post_id}] not exist from user favorites`,
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      await favorite.deleteOne()
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
        message: `Removed [post_id：${post_id}] from user favorites`,
      })
    }
    catch (e) {
      throw e
    }
  }
}
