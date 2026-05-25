// import * as mongoose from "mongoose";

// export const AnomalySchema = new mongoose.Schema({
//   id: String,
//   diagnosis_id: String,
//   model_name: String,
//   retake_measurement: Number,
//   result: Array,
//   start_end_peak: Array
// });
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type AnomalyDocument = HydratedDocument<Anomaly>

@Schema()
export class Anomaly {
  @Prop({ required: true })
  id: string

  @Prop({ required: true })
  diagnosis_id: string

  @Prop({ required: true })
  model_name: string

  @Prop()
  retake_measurement: number

  @Prop({ type: [Array], required: true })
  result: Array<any>

  @Prop({ type: [Array], required: true })
  start_end_peak: Array<any>
}

export const AnomalySchema = SchemaFactory.createForClass(Anomaly)
