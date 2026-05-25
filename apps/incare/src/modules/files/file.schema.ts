import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type FileDocument = HydratedDocument<File>

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true })
  file_type: string

  @Prop({ required: true })
  origin_file_name: string

  @Prop({ required: true })
  target_file_name: string

  @Prop({ required: true })
  target_url: string

  @Prop({ required: true })
  upload_user: string
}

export const FileSchema = SchemaFactory.createForClass(File)

// 配置 toJSON 選項
FileSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    return ret
  },
})
