import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common'
import { Public } from '../shared/decorators/public.decorator'
import { CreateEvaluationDTO } from './evaluation.dto'
import { EvaluationsService } from './evaluation.service'

@Public()
@Controller('evaluation')
export class EvalController {
  constructor(private service: EvaluationsService) {}

  @Post()
  saveEvaluation(@Body(new ValidationPipe()) body: CreateEvaluationDTO) {
    return this.service.saveEvaluation(body)
  }

  @Get()
  getAllEvaluations() {
    return this.service.getAllEvaluations()
  }

  @Get('/model/:model_name')
  getEvaluationsByModelName(@Param() params) {
    return this.service.getEvaluationsByModelName(params.model_name)
  }

  @Get(':diagnosis_id')
  getEvaluation(@Param() params) {
    return this.service.getEvaluation(params.diagnosis_id)
  }

  @Delete(':id')
  deleteEvaluation(@Param() params) {
    return this.service.deleteEvaluation(params.id)
  }
}
