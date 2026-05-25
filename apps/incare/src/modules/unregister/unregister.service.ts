import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { UnregisterUser, UnregisterUserDocument } from './unregister.schemas'

@Injectable()
export class UnregisterService {
  constructor(
    @InjectModel(UnregisterUser.name, 'sharedConnection')
    private unregisterModel: Model<UnregisterUserDocument>,
  ) {}

  async insertUnregister(user: any) {
    const createdUser = new this.unregisterModel(user)
    return createdUser.save()
  }
}
