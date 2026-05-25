import { Language, Roles } from '@incare/modules/shared/enums/common.enum'
// users/schemas/doctor-user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type DoctorUserDocument = HydratedDocument<DoctorUser>

export enum DoctorUserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

@Schema({
  collection: 'doctor_users',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false,
})
export class DoctorUser {
  @Prop({ required: true, unique: true })
  id: string

  @Prop({ trim: true })
  username?: string

  @Prop({ select: false })
  password?: string

  @Prop({ default: Roles.Regular, type: String })
  role: Roles

  @Prop({ required: true, unique: true })
  phone?: string

  @Prop({ required: true })
  signature: string

  @Prop()
  profile_image?: string

  @Prop({ default: Language.ZH_CN, type: String })
  language: Language

  @Prop({ default: DoctorUserStatus.PENDING, type: String })
  status: DoctorUserStatus
}

export const DoctorUserSchema
  = SchemaFactory.createForClass(DoctorUser)
