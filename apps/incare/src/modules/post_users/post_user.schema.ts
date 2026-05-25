import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type PostUserDocument = HydratedDocument<PostUser>

@Schema({ collection: 'post_users', timestamps: true })
export class PostUser {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId

  @Prop({ required: true })
  user_id: string

  @Prop({ type: Number, default: 1 })
  status: number
}

export const PostUserSchema = SchemaFactory.createForClass(PostUser)

// 配置 toJSON 選項
PostUserSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    return ret
  },
})
