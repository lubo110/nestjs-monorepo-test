import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AnomalyModule } from '../anomaly/anomaly.module'
import { Measure, MeasureSchema } from '../measures/measure.schemas'
import { ModelDetailsModule } from '../model_details/model_details.module'
import { ModelsInfoModule } from '../models_Info/models_Info.module'
import { NoteModule } from '../notes/note.module'
import { Note, NoteSchema } from '../notes/note.schemas'
import { CoreController } from './core.controller'
import { CoreService } from './core.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Measure.name, schema: MeasureSchema },
        { name: Note.name, schema: NoteSchema },
      ],
      'sharedConnection',
    ),
    NoteModule,
    ModelsInfoModule,
    ModelDetailsModule,
    AnomalyModule,
  ],
  controllers: [CoreController],
  providers: [CoreService],
  exports: [CoreService],
})
export class CoreModule {}
