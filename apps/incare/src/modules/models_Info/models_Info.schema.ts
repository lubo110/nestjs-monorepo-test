import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import * as mongoose from 'mongoose'

export type ModelsInfoDocument = mongoose.HydratedDocument<ModelsInfo>

@Schema({ collection: 'models_info', timestamps: true })
export class ModelsInfo {
  @Prop({ required: true })
  default: string

  @Prop({ type: [String], required: true })
  challengers: string[]
}

export const ModelsInfoSchema = SchemaFactory.createForClass(ModelsInfo)

// 配置 toJSON 選項
ModelsInfoSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    return ret
  },
})
