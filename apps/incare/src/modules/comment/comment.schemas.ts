import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose from 'mongoose'

export type CommentDocument = mongoose.HydratedDocument<Comment>

export class TextContent {
  @Prop({ required: true })
  lang: string

  @Prop({})
  text_content: string
}

export class Suggestion {
  @Prop({ required: true })
  id: string

  @Prop({ type: [TextContent] })
  text_contents: TextContent[]
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Comment {
  @Prop({ required: true })
  comment_id: string

  @Prop({ required: true })
  type: string

  @Prop({ type: [TextContent] })
  description: TextContent[]

  @Prop({ type: [Suggestion] })
  suggestions: Suggestion[]
}

export const CommentSchema = SchemaFactory.createForClass(Comment)

CommentSchema.set('toJSON', {
  virtuals: true, // 顯示所有虛擬欄位
  versionKey: false, // 移除 __v 欄位
  transform: (doc, ret) => {
    delete ret._id // 移除 _id 欄位（可選）
    return ret
  },
})

CommentSchema.set('toObject', { virtuals: true })
