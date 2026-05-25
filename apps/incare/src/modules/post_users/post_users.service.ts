import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { PostUser, PostUserDocument } from './post_user.schema'

@Injectable()
export class PostUsersService {
  private response: WaffleResponse
  constructor(
    @InjectModel(PostUser.name, 'sharedConnection')
    private readonly postUserModel: Model<PostUserDocument>,
  ) {}

  async readPostLog(post_id: string, user_id: string) {
    try {
      let read_log = await this.postUserModel.findOne({ post_id, user_id })
      if (!read_log) {
        read_log = await this.postUserModel.create({
          post_id,
          user_id,
        })
      }

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: read_log,
      })
    }
    catch {
      throw new ApiException(
        'PROCESS_FAILED',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async deleteLogs(post_id: string) {
    return await this.postUserModel.findOneAndDelete({ post_id })
  }
}
