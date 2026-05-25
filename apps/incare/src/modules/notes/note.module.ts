import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Note, NoteSchema } from './note.schemas'
import { NoteService } from './note.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Note.name, schema: NoteSchema }],
      'sharedConnection',
    ),
  ],
  providers: [NoteService],
  exports: [NoteService],
})
export class NoteModule {}
