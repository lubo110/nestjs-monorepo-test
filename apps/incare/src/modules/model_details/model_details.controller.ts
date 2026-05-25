import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common'
import {
  CreateModelDetailsDTO,
  UpdateModelDetailsDTO,
} from './model_details.dto'
import { ModelDetailsService } from './model_details.service'

@Controller()
export class ModelDetailsController {
  constructor(private readonly modelDetailsService: ModelDetailsService) {}

  @Get('/models/details/all')
  async getAllModelDetails(_data: Record<any, any>) {
    return this.modelDetailsService.getAllModelDetails()
  }

  @Get('/models/details/:name')
  async getModelDetails(@Param() params) {
    return this.modelDetailsService.getModelDetailsByName(params.name)
  }

  @Post('/models/details/create')
  async createModelDetails(
    @Body(new ValidationPipe()) body: CreateModelDetailsDTO,
  ) {
    return this.modelDetailsService.createModelDetails(body)
  }

  @Post('/models/details/update')
  async updateModelDetails(
    @Body(new ValidationPipe()) body: UpdateModelDetailsDTO,
  ) {
    return this.modelDetailsService.updateModelDetails(body)
  }

  // ====== Web to Server ======
  @Post('/models/admin/details/create')
  async createModelDetailsForAdmin(@Body() body) {
    return this.modelDetailsService.createModelDetails(body)
  }
}
