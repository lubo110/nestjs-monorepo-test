// schemas/identity-profile.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({
  collection: 'identity_profiles',
  timestamps: {
    createdAt: 'created_time',
    updatedAt: 'updated_time',
  },
})
export class IdentityProfile extends Document {
  @Prop({ required: true, unique: true, index: true })
  user_id: string

  @Prop({ required: true })
  real_name: string

  @Prop({ required: true, enum: ['male', 'female'] })
  gender: 'male' | 'female'

  @Prop({ required: true })
  birthday: Date

  @Prop({ required: true })
  id_card: string

  @Prop({ enum: ['ID_CARD', 'PASSPORT'], default: 'ID_CARD' })
  id_type: 'ID_CARD' | 'PASSPORT' // 新增证件类型字段

  @Prop({ default: 'manual' })
  source: 'manual' | 'import' | 'third_party'

  @Prop()
  created_time: Date

  @Prop()
  updated_time: Date
}

export const IdentityProfileSchema = SchemaFactory.createForClass(IdentityProfile)
