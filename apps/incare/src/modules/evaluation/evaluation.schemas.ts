import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'

export type EvaluationDocument = HydratedDocument<Evaluation>

@Schema()
export class Evaluation {
  @Prop({ required: true })
  id: string

  @Prop({ required: true })
  diagnosis_id: string

  @Prop({ required: true })
  model_name: string

  @Prop()
  evaluator: string

  @Prop({ type: [mongoose.Schema.Types.Mixed], required: true })
  evaluator_sequence: any[]

  @Prop({ type: [mongoose.Schema.Types.Mixed], required: true })
  ai_sequence: any[]

  @Prop()
  score: string

  @Prop({ required: true })
  channel: string

  @Prop({ required: true })
  x1: string

  @Prop({ required: true })
  x2: string

  @Prop({ required: true })
  evaluation: string

  @Prop({ default: () => new Date() })
  last_updated: Date
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation)

EvaluationSchema.pre<EvaluationDocument>('save', function (next) {
  if (this.isModified('evaluator_sequence') || this.isModified('ai_sequence')) {
    if (
      this.model_name === 'model_a'
      && this.evaluator_sequence.length !== this.ai_sequence.length
    ) {
      throw new Error(
        'evaluator_sequence and ai_sequence must be same size for model_a!',
      )
    }
  }
  this.last_updated = new Date()
  next()
})
