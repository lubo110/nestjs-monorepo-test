// import * as mongoose from "mongoose";

// export const MeasureSchema = new mongoose.Schema(
//   {
//     version: String, // 版本
//     enabled: Boolean,
//     measure_id: String, // 量測ID
//     diagnosis_id: String, // 診斷ID
//     measure_index: Number, // 第幾筆量測
//     measure_counts_by_second: Number, // 一秒偵測幾筆
//     counts: Number, // 量測總數量
//     peak_indexs: Array,
//     heart_rate: Array,
//     stress: Array,
//     event_count: Number,
//     event_detect: Array,
//     values: Array, // 量測數據
//     create_at: Date, // 建立時間
//     update_at: Date // 更新時間
//   },
//   { timestamps: { createdAt: "create_at", updatedAt: "update_at" } }
// );
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type MeasureDocument = HydratedDocument<Measure>

export class ECGValue {
  @Prop({ required: true })
  name: string

  @Prop({ type: [Number], required: true })
  raw_datas: number[]
}

export class BLEvents {
  @Prop({ type: [Number], required: true })
  timestamp: number[]

  @Prop({ type: [Number], required: true })
  event_type: number[]
}

@Schema({ timestamps: { createdAt: 'create_at', updatedAt: 'update_at' } })
export class Measure {
  @Prop({ required: true })
  version: string // 版本

  @Prop({ required: true })
  enabled: boolean

  @Prop({ required: true })
  measure_id: string // 量測ID

  @Prop({ required: true })
  diagnosis_id: string // 診斷ID

  @Prop({ required: true })
  measure_index: number // 第幾筆量測

  @Prop({ required: true })
  measure_counts_by_second: number // 一秒偵測幾筆

  @Prop({ required: true })
  counts: number // 量測總數量

  @Prop({ type: [Number] })
  peak_indexs: number[]

  @Prop({ type: [Number] })
  heart_rate: number[]

  @Prop({ type: [Number] })
  stress: number[]

  @Prop()
  event_count: number

  @Prop({ type: [BLEvents] })
  event_detect: BLEvents[]

  @Prop({ type: [ECGValue], required: true })
  values: ECGValue[]
}

export const MeasureSchema = SchemaFactory.createForClass(Measure)
