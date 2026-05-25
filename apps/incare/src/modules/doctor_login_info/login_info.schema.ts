import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type DoctorLoginInfoDocument = HydratedDocument<DotorLoginInfo>

@Schema({ collection: 'doctor_login_info', timestamps: true })
export class DotorLoginInfo {
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

export const DoctorLoginInfoSchema = SchemaFactory.createForClass(DotorLoginInfo)

// 配置 toJSON 選項
DoctorLoginInfoSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    return ret
  },
})
