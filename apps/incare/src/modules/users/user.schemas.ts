import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { AiTrainingAgreement, Language, Roles } from '../shared/enums/common.enum'

export type UserDocument = HydratedDocument<User>
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ required: true, unique: true })
  id: string

  @Prop({ default: '' })
  username: string

  @Prop({ default: '' })
  password: string

  @Prop({ default: Roles.Regular })
  role: string

  @Prop()
  hospitalAccess: string

  @Prop({ default: '' })
  email: string

  @Prop({ unique: true, sparse: true })
  phone: string

  @Prop({ default: false })
  verify_phone: boolean

  /**
   * 用户是否同意将心电图数据用于 AI 训练标识
   * 0 - 未确认（用户尚未对该授权进行确认操作）
   * 1 - 不同意（用户明确不同意将心电图数据用于 AI 训练）
   * 2 - 同意（用户明确同意将心电图数据用于 AI 训练）
   */
  @Prop({ default: AiTrainingAgreement.UNCONFIRMED })
  ai_training_agreement: number

  @Prop({ default: '' })
  gender: string

  @Prop({ default: '' })
  birthday: string

  @Prop()
  profile_image: string

  @Prop({ type: String, enum: Language, default: Language.EN_US })
  language: Language

  @Prop({ default: '' })
  height: string

  @Prop({ default: '' })
  weight: string

  @Prop({ default: '' })
  country: string

  @Prop()
  deviceToken: string

  @Prop({ default: '' })
  third_party_id: string

  @Prop()
  created_by: string

  @Prop()
  created_at: Date

  @Prop()
  verification_code: string

  @Prop()
  access_token: string

  @Prop()
  updated_at: Date
}

export const UserSchema = SchemaFactory.createForClass(User)
