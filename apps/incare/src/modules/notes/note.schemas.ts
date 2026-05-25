import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type NoteDocument = HydratedDocument<Note>

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Note {
  @Prop({ required: true })
  id: string // Id of the note

  @Prop({ required: true })
  diagnosis_id: string // 診斷ID

  @Prop({ required: true })
  note: string // note about the tagged sequence

  @Prop({ required: true })
  x1: string

  @Prop({ required: true })
  x2: string

  @Prop({ required: true })
  channel: string // which channel

  @Prop()
  created_at: Date

  @Prop()
  updated_at: Date
}

export const NoteSchema = SchemaFactory.createForClass(Note)
