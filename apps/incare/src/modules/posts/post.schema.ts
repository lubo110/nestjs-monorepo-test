import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type PostDocument = HydratedDocument<Post>
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false,
})
export class Post {
  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  category: string

  @Prop()
  content: string

  @Prop({ required: true })
  lang: string

  @Prop()
  published_flag: boolean

  @Prop()
  published_time: Date

  @Prop({ type: Types.ObjectId, ref: 'File', required: true })
  cover_image: Types.ObjectId

  @Prop({ type: [Types.ObjectId], ref: 'File' })
  attachments: Types.ObjectId[]

  @Prop({ type: [String] })
  hash_tag: string[]

  @Prop({ required: true, default: true })
  enabled: boolean

  @Prop({ required: true })
  create_user: string
}

export const PostSchema = SchemaFactory.createForClass(Post)

// 配置 toJSON 選項
PostSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    return ret
  },
})

PostSchema.virtual('read', {
  ref: 'PostUser',
  localField: '_id',
  foreignField: 'post_id',
  count: true,
})
