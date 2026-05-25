import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type ModelDetailsDocument = HydratedDocument<ModelDetails>

@Schema({
  collection: 'model_details',
  timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
})
export class ModelDetails {
  @Prop({ required: true })
  model_name: string

  @Prop()
  url: string

  @Prop()
  authorization: string

  @Prop()
  position: string

  @Prop()
  description: string

  @Prop()
  final_model: boolean
}

export const ModelDetailsSchema = SchemaFactory.createForClass(ModelDetails)

// 配置 toJSON 選項
ModelDetailsSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    return ret
  },
})
