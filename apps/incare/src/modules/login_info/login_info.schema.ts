import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type LoginInfoDocument = HydratedDocument<LoginInfo>

@Schema({ collection: 'login_info', timestamps: true })
export class LoginInfo {
  @Prop({ required: true })
  user_id: string

  @Prop({ required: true })
  jti: string

  @Prop()
  device_type?: string

  @Prop()
  os?: string

  @Prop()
  ua?: string

  @Prop({ required: true, default: true })
  is_active: boolean
}

export const LoginInfoSchema = SchemaFactory.createForClass(LoginInfo)

// 配置 toJSON 選項
LoginInfoSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    return ret
  },
})
