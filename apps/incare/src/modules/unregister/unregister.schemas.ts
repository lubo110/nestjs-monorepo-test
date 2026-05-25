import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type UnregisterUserDocument = HydratedDocument<UnregisterUser>

@Schema({ collection: 'unregister_users', timestamps: true })
export class UnregisterUser {
  @Prop({ required: true })
  id: string

  @Prop()
  password: string

  @Prop({ required: true })
  phone: string

  @Prop()
  role: string

  @Prop()
  email: string

  @Prop()
  gender: string

  @Prop()
  birthday: string

  @Prop()
  username: string

  @Prop()
  language: string

  @Prop()
  verify_phone: string

  @Prop()
  height: string

  @Prop()
  weight: string

  @Prop()
  country: string

  @Prop()
  created_time: Date
}

export const UnregisterUserSchema
  = SchemaFactory.createForClass(UnregisterUser)

// 配置 toJSON 選項
UnregisterUserSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    return ret
  },
})
