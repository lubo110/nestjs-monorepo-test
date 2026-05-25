import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AnomalyModule } from '../anomaly/anomaly.module'
import { Anomaly, AnomalySchema } from '../anomaly/anomaly.schemas'
import { Evaluation, EvaluationSchema } from '../evaluation/evaluation.schemas'
import { Measure, MeasureSchema } from '../measures/measure.schemas'
import { Note, NoteSchema } from '../notes/note.schemas'
import { UserModule } from '../users/user.module'
import { DiagnosisController } from './diagnosis.controller'
import { Diagnosis, DiagnosisSchema } from './diagnosis.schemas'
import { DiagnosisService } from './diagnosis.service'

@Module({
  imports: [
    forwardRef(() => UserModule),
    AnomalyModule,
    MongooseModule.forFeature(
      [
        { name: Diagnosis.name, schema: DiagnosisSchema },
        { name: Measure.name, schema: MeasureSchema },
        { name: Evaluation.name, schema: EvaluationSchema },
        { name: Note.name, schema: NoteSchema },
        { name: Anomaly.name, schema: AnomalySchema },
      ],
      'sharedConnection',
    ),
  ],
  providers: [DiagnosisService],
  controllers: [DiagnosisController],
  exports: [DiagnosisService],
})
export class DiagnosisModule {}
