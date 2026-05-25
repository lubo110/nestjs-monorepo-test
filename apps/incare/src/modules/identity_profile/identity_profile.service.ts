import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateIdentityProfileDTO } from './identity_profile.dto'
import { IdentityProfile } from './identity_profile.schema'

@Injectable()
export class IdentityProfileService {
  constructor(
    @InjectModel(IdentityProfile.name, 'sharedConnection')
    private readonly model: Model<IdentityProfile>,
  ) {}

  async findByUserId(userId: string) {
    return this.model.findOne({ user_id: userId }).lean()
  }

  async upsert(
    userId: string,
    dto: CreateIdentityProfileDTO,
  ) {
    return this.model.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          real_name: dto.real_name,
          gender: dto.gender,
          birthday: new Date(dto.birthday),
          id_card: dto.id_card,
          source: 'manual',
        },
      },
      {
        new: true,
        upsert: true,
        projection: { _id: 0, __v: 0 },
      },
    )
  }

  async deleteByUserId(userId: string) {
    const result = await this.model.deleteOne({ user_id: userId })
    // 返回 true 表示删除成功（删除了至少一条）
    return result.deletedCount > 0
  }
}
