import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import moment = require('moment')
import { Model } from 'mongoose'
import { ConfigurationDocument } from '../configuration/configuration.schemas'
import { ConfigurationService } from '../configuration/configuration.service'
import { FileService } from '../files/file.service'
import { PostUsersService } from '../post_users/post_users.service'
import {
  Language,
  OrderByType,
  WaffleRequestStatus,
} from '../shared/enums/common.enum'
import { SystemParams } from '../shared/enums/system.params.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { checkChineseCharacter } from '../shared/utils/util'
import { UserService } from '../users/user.service'
import {
  CreatePostDTO,
  PublishPostDTO,
  QueryListPostDTO,
  UpdatePostDTO,
} from './post.dto'
import { Post, PostDocument } from './post.schema'

@Injectable()
export class PostService {
  private response: WaffleResponse
  constructor(
    @InjectModel(Post.name, 'sharedConnection')
    private readonly postModel: Model<PostDocument>,
    private readonly userService: UserService,
    private readonly fileService: FileService,
    private readonly postUserService: PostUsersService,
    private readonly configService: ConfigurationService,
  ) {}

  // 需要檢核category是否屬於系統中的設定
  async createPost(body: CreatePostDTO) {
    try {
      const user = await this.userService.findByUserId(body.create_user)
      if (!user) {
        throw new ApiException(
          'user not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.NOT_FOUND,
        )
      }

      // 取得指定語言中的文章分類
      const found_category = await this.configService.getCategoriesListByLang(
        body.lang,
      )
      // 檢查指定語言中的文章分類是否存在
      if (body.category) {
        this.configService.checkSystemCategories(found_category, body.category)
      }

      const new_post = {
        title: body.title,
        category: body.category || '',
        content: body.content,
        lang: body.lang,
        published_flag: false,
        attachments: body.attachments,
        hash_tag: body.hash_tag,
        cover_image: body.cover_image,
        create_user: body.create_user,
      }
      const res = await this.postModel.create(new_post)
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: res,
      })
    }
    catch (e) {
      throw e
    }
  }

  async editPost(body: UpdatePostDTO) {
    try {
      const { user_id, post_id, ...update_obj } = body
      const user = await this.userService.findByUserId(user_id)
      if (!user) {
        throw new ApiException(
          'user not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.NOT_FOUND,
        )
      }

      const foundPost = await this.getPostByPostId(post_id)
      if (!foundPost) {
        throw new ApiException(
          'post not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.NOT_FOUND,
        )
      }

      // 如果有傳入lang，以傳入的lang檢核，若沒有就用原始紀錄的lang
      const new_lang = body.lang || foundPost.lang
      if (new_lang && body.category) {
        // 取得指定語言中的文章分類
        const found_category = await this.configService.getCategoriesListByLang(
          new_lang,
        )
        // 檢查指定語言中的文章分類是否存在
        this.configService.checkSystemCategories(found_category, body.category)
      }

      const updated = await this.postModel.findOneAndUpdate(
        { _id: post_id },
        update_obj,
        {
          new: true,
        },
      )

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: updated,
        message: `Post has been updated successfully`,
      })
    }
    catch (e) {
      throw e
    }
  }

  async setPublishTime(body: PublishPostDTO) {
    try {
      const foundPost = await this.getPostByPostId(body.post_id)
      if (!foundPost) {
        throw new ApiException(
          'post not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.NOT_FOUND,
        )
      }
      await this.postModel.findOneAndUpdate(
        {
          _id: body.post_id,
        },
        { published_time: body.published_time, published_flag: true },
      )
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
        message: `Post has been updated successfully`,
      })
    }
    catch (e) {
      throw e
    }
  }

  async Published() {
    try {
      const posts: PostDocument[] = await this.postModel.find({
        published_time: { $lte: new Date() },
        published_flag: false,
        enabled: true,
      })
      const post_ids: string[] = posts.map(post => post._id.toString())
      console.log(`總共需發布筆數： ${post_ids.length} `)

      for (const i in post_ids) {
        console.log(`[${i}][post_id： ${post_ids[i]}] 開始發布`)
        await this.postModel
          .findByIdAndUpdate(
            { _id: post_ids[i] },
            {
              published_flag: true,
            },
          )
          .catch((e) => {
            console.log(e)
            console.log(
              `[${i}][[post_id： ${post_ids[i]}] 發布發生異常，略過此次發布`,
            )
          })
        console.log(`[${i}][[post_id： ${post_ids[i]}] 完成`)
      }
    }
    catch (e) {
      throw new InternalServerErrorException(e)
    }
  }

  async deletePost(post_id: string, _user_id: string) {
    const foundPost = await this.getPostByPostId(post_id)
    if (!foundPost) {
      throw new ApiException(
        `[post_id：${post_id}] not exists `,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }

    // 刪除附件
    if (foundPost.attachments && foundPost.attachments.length > 0) {
      try {
        // 將 ObjectId 轉換為字串陣列
        const attachment_ids = foundPost.attachments.map(id => id.toString())
        await this.fileService.removeFiles(attachment_ids)
      }
      catch {
        throw new ApiException(
          'Failed to delete attachments',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }

    try {
      await foundPost.deleteOne()
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
        message: 'The post has been deleted successfully',
      })
    }
    catch {
      throw new ApiException(
        'An error occurred deleting the post',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getPost(post_id: string, user_id: string, populate: boolean = true) {
    try {
      const user = await this.userService.findByUserId(user_id)
      if (!user) {
        throw new ApiException(
          'user not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.NOT_FOUND,
        )
      }
      let foundPost = null
      if (!populate) {
        foundPost = await this.getPostByPostId(post_id)
      }
      else {
        foundPost = await this.getPostByPostIdWithPopulate(post_id)
      }
      if (!foundPost) {
        throw new ApiException(
          'post not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.NOT_FOUND,
        )
      }

      // save reading-log for user
      if (user.phone !== '77311699') {
        await this.postUserService.readPostLog(post_id, user_id).catch((e) => {
          console.log('Failed to save post-user record')
          console.log(e)
        })
      }

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: foundPost,
      })
    }
    catch (e) {
      throw e
    }
  }

  async getListPosts(body: QueryListPostDTO) {
    const {
      user_id,
      start_num,
      end_num,
      order_by,
      lang,
      published_flag,
      enable,
    } = body
    const order: number = order_by === OrderByType.DESC ? -1 : 1
    const query_num = end_num - start_num + 1
    const skip_num = start_num - 1
    let sort_by: any = {}

    try {
      const user = await this.userService.findByUserId(user_id)
      if (!user) {
        throw new ApiException(
          'user not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.NOT_FOUND,
        )
      }

      // default filter
      const filter: any = {
        published_flag: true,
        enabled: true,
      }

      if (lang) {
        // check chinese character and change to LowerCase
        filter.lang = checkChineseCharacter(lang.toLowerCase())
      }

      // For regular user
      if (user.phone !== '77311699') {
        filter.published_time = { $lte: new Date() }
        if (!lang) {
          // default lang = en_us
          filter.lang = Language.EN_US
        }
        // order by published_time
        sort_by = { published_time: order }
      }
      else {
        // For admin
        if (published_flag !== undefined) {
          filter.published_flag = published_flag
        }
        if (enable !== undefined) {
          filter.enabled = enable
        }

        // order by _id
        sort_by = { _id: order }
      }
      const posts_counts: number = await this.postModel
        .countDocuments(filter)
        .catch((e) => {
          throw new InternalServerErrorException(e)
        })

      const posts: any[] = await this.postModel
        .find(filter)
        .populate('attachments', 'file_type target_file_name target_url')
        .populate('cover_image', 'target_url')
        .populate({
          path: 'read',
          match: {
            user_id,
          },
        })
        .sort(sort_by)
        .limit(query_num)
        .skip(skip_num)
        .catch((e) => {
          throw new InternalServerErrorException(e)
        })

      const foundCategories: ConfigurationDocument
        = await this.configService.findOneConfiguration(SystemParams.Categories)
      const categoriesValue: any = foundCategories.value

      const categoriesArray: [{ category_id: string, name: string }]
        = categoriesValue[lang]

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {
          counts: posts_counts,
          posts: posts.map(
            ({
              _id,
              title,
              category,
              cover_image,
              published_flag,
              enabled,
              published_time,
              read,
            }): any => {
              const match_category = categoriesArray?.find(
                o => o.category_id === category,
              )
              return {
                _id,
                title,
                category: match_category || {},
                cover_image: cover_image || {},
                published_flag: published_flag || false,
                enabled,
                published_time: published_time
                  ? moment(published_time).format('YYYY-MM-DD')
                  : '',
                read,
              }
            },
          ),
        },
      })
    }
    catch (e) {
      throw e
    }
  }

  async disablePost(post_id: string, user_id: string, enabled: boolean) {
    const foundPost = await this.getPostByPostId(post_id)
    if (!foundPost) {
      throw new ApiException(
        `[post_id：${post_id}] not exists `,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }
    try {
      await this.postModel.findOneAndUpdate({ _id: post_id }, { enabled })
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
        message: `The post is ${enabled ? 'active' : 'inactive'}`,
      })
    }
    catch {
      throw new ApiException(
        'An error occurred deleting the post',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async getPostByPostId(post_id: string): Promise<PostDocument> {
    return await this.postModel.findOne({ _id: post_id }).catch((e) => {
      throw new InternalServerErrorException(e)
    })
  }

  async getPostByPostIdWithPopulate(post_id: string) {
    return await this.postModel
      .findOne({ _id: post_id })
      .populate('attachments', 'file_type target_file_name target_url')
      .catch((e) => {
        throw new InternalServerErrorException(e)
      })
  }
}
