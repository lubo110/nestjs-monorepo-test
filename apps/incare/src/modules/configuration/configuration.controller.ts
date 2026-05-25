import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { Public } from '../shared/decorators/public.decorator'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import {
  CreateCategoryParamsDTO,
  CreateConfigurationDTO,
  EditCategoryParamsDTO,
  RemoveCategoryParamsDTO,
  UpdateConfigurationDTO,
} from './configuration.dto'
import { Configuration } from './configuration.schemas'
import { ConfigurationService } from './configuration.service'

@Controller('')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @UseInterceptors(LoggerInterceptor)
  @Post('/config/create')
  createConfiguration(@Body() body: CreateConfigurationDTO) {
    return this.configurationService.createConfiguration(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Get('/config/find/:key')
  findOneConfiguration(@Param('key') key: string) {
    return this.configurationService.findOneConfiguration(key)
  }

  @UseInterceptors(LoggerInterceptor)
  @Put('/config/language/add/:code')
  addLanguageCode(@Param('code') code: string) {
    return this.configurationService.addLanguageCode(code)
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete('/config/language/delete/:code')
  removeLanguageCode(@Param('code') code: string) {
    return this.configurationService.removeLanguageCode(code)
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/config/post/category')
  addNewsTypes(@Body(new ValidationPipe()) body: CreateCategoryParamsDTO) {
    return this.configurationService.addNewsCategory(
      body.lang,
      body.category_name,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Patch('/config/post/category')
  editNewsTypes(@Body(new ValidationPipe()) body: EditCategoryParamsDTO) {
    return this.configurationService.editNewsCategory(
      body.lang,
      body.category_id,
      body.category_name,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete('/config/post/category')
  removeNewsCategory(
    @Body(new ValidationPipe()) body: RemoveCategoryParamsDTO,
  ) {
    return this.configurationService.removeNewsCategory(
      body.lang,
      body.category_id,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Get('/config/post/category/:lang')
  findCategoriesByLanguage(@Param('lang') lang: string) {
    return this.configurationService.findCategoriesByLanguage(lang)
  }

  @Public()
  @UseInterceptors(LoggerInterceptor)
  @Get('/config/country-codes/valid')
  async getValidPhoneCountryCodes(): Promise<WaffleResponse> {
    return this.configurationService.getValidPhoneCountryCodes()
  }

  @Get('/config/get/:name')
  async findOneByName(@Param('name') name: string): Promise<Configuration> {
    return this.configurationService.findOneByName(name)
  }

  @UseInterceptors(LoggerInterceptor)
  @Delete('/config/delete/:key')
  removeOne(@Param('key') key: string) {
    return this.configurationService.removeConfiguration(key)
  }

  @UseInterceptors(LoggerInterceptor)
  @Patch('/config/update')
  updateOne(@Body() body: UpdateConfigurationDTO) {
    return this.configurationService.updateConfiguration(body)
  }
}
