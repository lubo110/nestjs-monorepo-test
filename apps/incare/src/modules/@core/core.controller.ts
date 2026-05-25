import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { CreateNoteDTO } from '../notes/note.dto'
import { NoteService } from '../notes/note.service'
import { Public } from '../shared/decorators/public.decorator'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import { CoreService } from './core.service'

@Controller('')
export class CoreController {
  constructor(
    private readonly service: CoreService,
    private readonly noteService: NoteService,
  ) {}

  /**
   * Notes
   */

  @UseInterceptors(LoggerInterceptor)
  @Get('/notes/:diagnosis_id')
  handleNoteDiagnosis(@Param() params) {
    return this.noteService.getNotes(params.diagnosis_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Get('/notes/')
  handleNoteGet() {
    return this.noteService.getAllNotes()
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/notes/create')
  handleNoteCreate(@Body(new ValidationPipe()) body: CreateNoteDTO) {
    return this.noteService.createNote(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Put('/notes/modify')
  handleNoteModify(@Body(new ValidationPipe()) body: CreateNoteDTO) {
    return this.noteService.modifyNote(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete('/notes/delete/:id')
  handleNoteDelete(@Param() params) {
    return this.noteService.deleteNote(params.id.toString())
  }

  /***
   * Machine Learning requests
   */
  @Public()
  @Get('/anomaly/:model_name/:diagnosis_id')
  async getAnomaliesByModelName(@Param() params) {
    return this.service.getAnomaliesByModelName(
      params.model_name,
      params.diagnosis_id,
      '2',
    )
  }

  /**
   * Delete saved ML result
   */
  @Public()
  @UseInterceptors(LoggerInterceptor)
  @Delete('/models/delete/ml_result/:diagnosis_id/:model_name')
  async deleteSavedAnomalyResult(@Param() params) {
    return this.service.deleteSavedAnomalyResult(
      params.model_name,
      params.diagnosis_id,
    )
  }

  /*
    Autoencoder inference
  */
  @Public()
  @Get('/anomaly/autoencoder/:version/:diagnosis_id')
  async getAnomaliesWithAutoencoder(@Param() params) {
    return this.service.getAnomaliesWithAutoencoder(
      params.version,
      params.diagnosis_id,
    )
  }

  // ====== Web to Server ======
  @Get('/anomaly/admin/:model_name/:diagnosis_id')
  async getAnomaliesByModelNameForAdmin(@Param() params) {
    return this.service.getAnomaliesByModelName(
      params.model_name,
      params.diagnosis_id,
      '2',
    )
  }

  @Public()
  @Get('health')
  checkHealth() {
    return { status: 'ok' }
  }
}
