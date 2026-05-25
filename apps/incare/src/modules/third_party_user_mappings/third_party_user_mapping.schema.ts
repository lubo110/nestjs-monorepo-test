import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type ThirdPartyUserMappingDocument
  = HydratedDocument<ThirdPartyUserMapping>

@Schema({ collection: 'third_party_user_mappings', timestamps: true })
export class ThirdPartyUserMapping {
  @Prop({ required: true })
  third_party_id: string // 對應合作夥伴的唯一 ID

  @Prop({ required: true })
  external_user_id: string // 代表外部合作夥伴的用戶 ID

  @Prop({ required: true })
  internal_user_id: string // 系統內對應用戶 ID

  @Prop({ required: true, default: true })
  is_active: boolean // 用戶是否啟用
}

export const ThirdPartyUserMappingSchema = SchemaFactory.createForClass(
  ThirdPartyUserMapping,
)
