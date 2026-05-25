import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import * as mongoose from 'mongoose'

export type ConfigurationDocument = mongoose.HydratedDocument<Configuration>

@Schema({ timestamps: true })
export class Configuration {
  @Prop({ required: true, unique: true })
  key: string

  @Prop({ required: true })
  category: string

  @Prop({ required: true })
  type: string

  @Prop()
  description?: string

  @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
  value: any
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration)
