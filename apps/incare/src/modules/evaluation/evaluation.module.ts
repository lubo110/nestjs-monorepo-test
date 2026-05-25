import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EvalController } from './evaluation.controller'
import { Evaluation, EvaluationSchema } from './evaluation.schemas'
import { EvaluationsService } from './evaluation.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Evaluation.name, schema: EvaluationSchema }],
      'sharedConnection',
    ),
  ],
  controllers: [EvalController],
  providers: [EvaluationsService],
  exports: [],
})
export class EvaluationsModule {}
