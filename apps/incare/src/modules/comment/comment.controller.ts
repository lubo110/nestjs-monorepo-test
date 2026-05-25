import { CurrentUser } from '@incare/modules/shared/decorators/current_user.decorator'
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common'
import { JwtPayload } from '../auth/auth.interface'
import { RolesGuard } from '../guards/roles.guard'
import { Permissions } from '../shared/decorators/permission.decorator'
import { Platform } from '../shared/enums/common.enum'
import { LoggerInterceptor } from '../shared/interceptors/logger.interceptor'
import {
  CreateCommentDTO,
  DeleteCommentSuggestionDTO,
  DeleteSuggestionLanguageDTO,
  EditCommentDTO,
  QueryCommentDTO,
} from './comment.dto'
import { CommentService } from './comment.service'

/**
 * Prediction Comment
 */
@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Post('/prediction/comment/create')
  async createComment(@Body(new ValidationPipe()) body: CreateCommentDTO) {
    return this.commentService.createComment(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Post('/prediction/comment/edit')
  async editComment(@Body(new ValidationPipe()) body: EditCommentDTO) {
    return this.commentService.editPredictionComment(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Delete('/prediction/comment/delete/:comment_id')
  async deleteComment(@Param('comment_id') comment_id) {
    return this.commentService.deleteCommentById(comment_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Delete('/prediction/comment/suggestion/delete')
  async deleteCommentSuggestion(
    @Body(new ValidationPipe()) body: DeleteCommentSuggestionDTO,
  ) {
    return this.commentService.deleteCommentSuggestion(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Delete('/prediction/comment/suggestion/language/delete')
  async deleteSuggestionLanguage(
    @Body(new ValidationPipe()) body: DeleteSuggestionLanguageDTO,
  ) {
    return this.commentService.deleteSuggestionLanguage(body)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Get('/prediction/comment/findall')
  async getAllComment() {
    return this.commentService.findAllComments()
  }

  @UseInterceptors(LoggerInterceptor)
  @Post('/prediction/comment/get/comments/offline')
  async findCommentsV2(
    @CurrentUser() user: JwtPayload,
    // 默认为 Platform.MOBILE ，兼容国际版老版本app
    @Headers(Platform.HEADER_KEY) platform: Platform = Platform.MOBILE,
    @Body(new ValidationPipe()) body: QueryCommentDTO,
  ) {
    return this.commentService.getPredictionCommentsV2(
      body.diagnosis_id,
      body.lang,
      platform,
      user,
      body.push_type,
    )
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Get('/prediction/status/:diagnosis_id')
  async getPredictionStatusByDiagnosisId(@Param('diagnosis_id') diagnosis_id) {
    return this.commentService.getPredictionStatusByDiagnosisId(diagnosis_id)
  }

  @UseInterceptors(LoggerInterceptor)
  @Permissions('admin')
  @UseGuards(RolesGuard)
  @Get('/prediction/comment/find/:type')
  async findOneComment(@Param('type') type) {
    return this.commentService.findOneCommentByType(type)
  }
}
