import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type ThirdPartyDocument = HydratedDocument<ThirdParty>

@Schema({ collection: 'third_parties', timestamps: true })
export class ThirdParty {
  @Prop({ required: true, unique: true })
  third_party_id: string // 第三方客戶唯一 ID

  @Prop({ required: true, unique: true })
  third_party_name: string // 第三方客戶名稱

  @Prop({ required: false })
  api_id: string // 預留字段，未來可能用於識別 API

  @Prop({ required: true })
  api_key: string // hashed api_key

  @Prop({ required: true })
  expiry_date: Date

  @Prop({ required: false })
  i8_device_name_prefix: string

  @Prop({ required: true, default: true })
  is_active: boolean
}

export const ThirdPartySchema = SchemaFactory.createForClass(ThirdParty)
