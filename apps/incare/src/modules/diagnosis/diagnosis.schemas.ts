import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import {
  DiagnosisType,
  PredictionStatus,
} from '../shared/enums/diagnosis.enum'

export type DiagnosisDocument = HydratedDocument<Diagnosis>

@Schema({
  collection: 'diagnoses',
  timestamps: { createdAt: 'create_date', updatedAt: 'update_date' },
})
export class Diagnosis {
  @Prop({ required: true })
  version: string

  @Prop({ required: true })
  enabled: boolean

  @Prop()
  medical_id: string

  @Prop()
  medical_record_number: string // 20240827新增病例號欄位

  @Prop({ required: true, enum: DiagnosisType, type: String })
  diagnosis_type: DiagnosisType

  @Prop({ required: true })
  diagnosis_id: string

  @Prop({ required: true, default: false })
  synthetic: boolean

  @Prop({ required: true })
  device_id: string

  @Prop({ required: true })
  firmware_version: string

  @Prop({ required: true })
  mac_address: string

  @Prop({ required: true })
  gain: string

  @Prop({ required: true })
  latitude: string

  @Prop({ required: true })
  longitude: string

  @Prop({ required: true })
  measure_times: string

  @Prop({ required: true })
  measure_type: string

  @Prop({ required: true })
  user_id: string

  @Prop()
  name?: string

  @Prop()
  age?: number

  @Prop()
  gender?: string

  @Prop()
  phone?: string

  @Prop({ type: [String] })
  prediction_result?: string[]

  @Prop({ default: '' })
  prediction_model?: string

  @Prop({
    enum: PredictionStatus,
    default: PredictionStatus.Initial,
    type: String,
  })
  prediction_status?: PredictionStatus

  @Prop()
  start_time: Date

  @Prop()
  end_time: Date

  @Prop()
  create_date: Date

  @Prop()
  update_date: Date
}

export const DiagnosisSchema = SchemaFactory.createForClass(Diagnosis)

DiagnosisSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: 'id',
  justOne: true,
})

DiagnosisSchema.virtual('doctorDiagnosis', {
  ref: 'DoctorDiagnosis',
  localField: 'diagnosis_id',
  foreignField: 'diagnosis_id',
  justOne: true,
})

DiagnosisSchema.set('toJSON', {
  virtuals: true,
})

DiagnosisSchema.set('toObject', {
  virtuals: true,
})
