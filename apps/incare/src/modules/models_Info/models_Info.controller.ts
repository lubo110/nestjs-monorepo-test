import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import { AddModelsInfoDTO, UpdateModelsInfoDTO } from './models_Info.dto'
import { ModelsInfoService } from './models_Info.service'

@UseInterceptors(LoggerInterceptor)
@Controller()
export class ModelsInfoController {
  constructor(private readonly modelsInfoService: ModelsInfoService) {}

  @Get('/models/name')
  async getAllModels() {
    return this.modelsInfoService.getModelsInfo()
  }

  @Put('/models/default/:model')
  async setDefaultModel(@Param() params) {
    return this.modelsInfoService.setDefaultModel(params.model)
  }

  @Post('/models/add')
  async insertNewModel(@Body(new ValidationPipe()) body: AddModelsInfoDTO) {
    return this.modelsInfoService.addTrainedModel(
      body.model_name,
      body.is_default,
    )
  }

  @Post('/models/update')
  async updateModelInfo(@Body(new ValidationPipe()) body: UpdateModelsInfoDTO) {
    return this.modelsInfoService.updateModelInfo(body)
  }

  @Put('/models/delete/:model')
  async deleteChallenger(@Param() params) {
    return this.modelsInfoService.deleteChallenger(params.model)
  }

  // ====== Web to Server ======

  @Get('/models/admin/name')
  async getAllModelsForAdmin() {
    return this.modelsInfoService.getModelsInfo()
  }

  @Post('/models/admin/add')
  async insertNewModelForAdmin(
    @Body(new ValidationPipe()) body: AddModelsInfoDTO,
  ) {
    return this.modelsInfoService.addTrainedModel(
      body.model_name,
      body.is_default,
    )
  }

  @Put('/models/admin/default/:model')
  async setDefaultModelForAdmin(@Param('model') model: string) {
    return this.modelsInfoService.setDefaultModel(model)
  }

  @Put('/models/admin/delete/:model')
  async deleteModelForAdmin(@Param('model') model: string) {
    return this.modelsInfoService.deleteChallenger(model)
  }
}
