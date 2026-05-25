import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { MembershipSource, MembershipStatus } from './membership.enum'

export type MembershipDocument = Membership & Document

@Schema({
  collection: 'memberships',
  timestamps: {
    createdAt: 'create_time',
    updatedAt: 'update_time',
  },
})
export class Membership {
  @Prop({ required: true, unique: true, index: true })
  user_id: string

  @Prop({ required: true })
  start_time: Date

  @Prop({ required: true })
  end_time: Date

  @Prop({ enum: MembershipStatus, default: 'active', type: String })
  status: MembershipStatus

  @Prop({ enum: MembershipSource, default: 'order', type: String })
  source: MembershipSource

  @Prop({ required: true })
  source_id: string

  @Prop()
  note?: string

  @Prop()
  create_time: Date

  @Prop()
  update_time: Date
}

export const MembershipSchema = SchemaFactory.createForClass(Membership)
