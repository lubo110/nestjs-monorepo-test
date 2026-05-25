import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type FavoriteDocument = HydratedDocument<Favorite>

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId

  @Prop({ required: true })
  user_id: string
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite)

// 配置 toJSON 選項
FavoriteSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    return ret
  },
})
